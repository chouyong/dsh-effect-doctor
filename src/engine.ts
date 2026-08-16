import {
  type AuditAdapter,
  type AuditFixture,
  type AuditOutcome,
  type AuditPhase,
  type AuditReceipt,
  type ErrorSummary,
  EXIT_CODES,
  RECEIPT_SCHEMA_VERSION,
  type ResourceSnapshot,
  type RuntimeIdentity,
  type SnapshotDelta,
} from './contracts.js'
import { compareSnapshots, snapshotsEqual } from './compare.js'

const LIMITATIONS = [
  'Observes Cordis-managed fibers, effects, listeners, services, and registry runtimes only.',
  'Does not detect bare timers, global DOM listeners, native handles, external processes, or arbitrary memory leaks.',
  'Private Cordis projections are accepted only through the pinned adapter and fail closed on structural drift.',
] as const

export interface AuditConfiguration {
  operationTimeoutMs: number
  settleWindowMs: number
  settlePollMs: number
}

export interface RunAuditOptions<Context, Fiber> {
  adapter: AuditAdapter<Context, Fiber>
  context: Context
  fixture: AuditFixture<Context>
  runtime: RuntimeIdentity
  configuration?: Partial<AuditConfiguration>
}

const DEFAULT_CONFIGURATION: AuditConfiguration = {
  operationTimeoutMs: 1_000,
  settleWindowMs: 250,
  settlePollMs: 25,
}

class PhaseTimeoutError extends Error {
  constructor(readonly phase: AuditPhase) {
    super(`${phase} exceeded its configured timeout`)
    this.name = 'PhaseTimeoutError'
  }
}

function emptyDelta(): SnapshotDelta {
  return { added: [], removed: [] }
}

function normalizeConfiguration(
  input: Partial<AuditConfiguration> | undefined,
): AuditConfiguration {
  const configuration = { ...DEFAULT_CONFIGURATION, ...input }
  for (const [name, value] of Object.entries(configuration)) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`${name} must be a positive integer`)
    }
  }
  if (configuration.settlePollMs > configuration.settleWindowMs) {
    throw new RangeError('settlePollMs must not exceed settleWindowMs')
  }
  return configuration
}

function receipt(
  runtime: RuntimeIdentity,
  fixture: string,
  configuration: AuditConfiguration,
  phases: ResourceSnapshot[],
  delta: SnapshotDelta,
  errors: ErrorSummary[],
  outcome: AuditOutcome,
): AuditReceipt {
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    runtime,
    target: { fixture },
    configuration,
    phases,
    delta,
    errors,
    outcome,
    exitCode: EXIT_CODES[outcome],
    limitations: [...LIMITATIONS],
  }
}

function errorSummary(error: unknown, phase: AuditPhase): ErrorSummary {
  if (error instanceof Error) {
    const value = error as Error & { code?: unknown }
    const code = typeof value.code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(value.code)
      ? value.code
      : undefined
    return {
      phase,
      name: value.name || 'Error',
      ...(code === undefined ? {} : { code }),
    }
  }
  return { phase, name: 'UnknownError' }
}

async function within<T>(
  phase: AuditPhase,
  timeoutMs: number,
  operation: (signal: AbortSignal) => T | PromiseLike<T>,
): Promise<T> {
  const controller = new AbortController()
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new PhaseTimeoutError(phase))
    }, timeoutMs)
  })
  try {
    return await Promise.race([Promise.resolve(operation(controller.signal)), timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function phaseSnapshot(
  snapshot: ResourceSnapshot,
  phase: AuditPhase,
): ResourceSnapshot {
  return { phase, resources: snapshot.resources }
}

async function settle<Context, Fiber>(
  adapter: AuditAdapter<Context, Fiber>,
  context: Context,
  configuration: AuditConfiguration,
): Promise<ResourceSnapshot> {
  const deadline = Date.now() + configuration.settleWindowMs
  let previous = adapter.snapshot(context, 'settle')
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, configuration.settlePollMs))
    const current = adapter.snapshot(context, 'settle')
    if (snapshotsEqual(previous, current)) return current
    previous = current
  }
  throw new PhaseTimeoutError('settle')
}

function isTimeout(error: unknown): error is PhaseTimeoutError {
  return error instanceof PhaseTimeoutError
}

export async function runAudit<Context, Fiber>(
  options: RunAuditOptions<Context, Fiber>,
): Promise<AuditReceipt> {
  const configuration = normalizeConfiguration(options.configuration)
  const phases: ResourceSnapshot[] = []
  const errors: ErrorSummary[] = []
  const support = options.adapter.probe(options.context, options.runtime)
  if (!support.supported) {
    return receipt(
      options.runtime,
      options.fixture.name,
      configuration,
      phases,
      emptyDelta(),
      errors,
      support.outcome,
    )
  }

  let baseline: ResourceSnapshot
  try {
    baseline = options.adapter.snapshot(options.context, 'baseline')
    phases.push(baseline)
  } catch (error) {
    errors.push(errorSummary(error, 'baseline'))
    return receipt(
      options.runtime,
      options.fixture.name,
      configuration,
      phases,
      emptyDelta(),
      errors,
      'UNVERIFIABLE_SURFACE',
    )
  }

  let fiber: Fiber | undefined
  let primaryFailure: 'FAIL_MOUNT' | 'FAIL_EXERCISE' | 'FAIL_TIMEOUT' | undefined
  let cursor = options.adapter.errorCursor(options.context)
  try {
    fiber = options.adapter.mount(options.context, options.fixture.plugin)
    await within('mount', configuration.operationTimeoutMs, () => Promise.resolve(fiber))
    phases.push(options.adapter.snapshot(options.context, 'mount'))
  } catch (error) {
    errors.push(errorSummary(error, 'mount'))
    errors.push(...options.adapter.errorsSince(options.context, cursor, 'mount'))
    primaryFailure = 'FAIL_MOUNT'
  }

  if (fiber !== undefined && primaryFailure === undefined) {
    cursor = options.adapter.errorCursor(options.context)
    try {
      if (options.fixture.exercise !== undefined) {
        await within('exercise', configuration.operationTimeoutMs, signal => {
          return options.fixture.exercise!(options.context, signal)
        })
      }
      phases.push(options.adapter.snapshot(options.context, 'exercise'))
      errors.push(...options.adapter.errorsSince(options.context, cursor, 'exercise'))
    } catch (error) {
      errors.push(errorSummary(error, 'exercise'))
      errors.push(...options.adapter.errorsSince(options.context, cursor, 'exercise'))
      primaryFailure = isTimeout(error) ? 'FAIL_TIMEOUT' : 'FAIL_EXERCISE'
    }
  }

  if (fiber !== undefined) {
    cursor = options.adapter.errorCursor(options.context)
    try {
      await within('unmount', configuration.operationTimeoutMs, () => options.adapter.dispose(fiber!))
      phases.push(options.adapter.snapshot(options.context, 'unmount'))
      errors.push(...options.adapter.errorsSince(options.context, cursor, 'unmount'))
    } catch (error) {
      errors.push(errorSummary(error, 'unmount'))
      errors.push(...options.adapter.errorsSince(options.context, cursor, 'unmount'))
      return receipt(
        options.runtime,
        options.fixture.name,
        configuration,
        phases,
        emptyDelta(),
        errors,
        isTimeout(error) ? 'FAIL_TIMEOUT' : 'FAIL_DISPOSE',
      )
    }
  }

  if (errors.some(error => error.phase === 'unmount')) {
    return receipt(
      options.runtime,
      options.fixture.name,
      configuration,
      phases,
      emptyDelta(),
      errors,
      'FAIL_DISPOSE',
    )
  }

  if (primaryFailure !== undefined) {
    return receipt(
      options.runtime,
      options.fixture.name,
      configuration,
      phases,
      emptyDelta(),
      errors,
      primaryFailure,
    )
  }

  let settled: ResourceSnapshot
  try {
    settled = await settle(options.adapter, options.context, configuration)
    phases.push(settled)
  } catch (error) {
    errors.push(errorSummary(error, 'settle'))
    return receipt(
      options.runtime,
      options.fixture.name,
      configuration,
      phases,
      emptyDelta(),
      errors,
      isTimeout(error) ? 'FAIL_TIMEOUT' : 'UNVERIFIABLE_SURFACE',
    )
  }

  const compared = phaseSnapshot(settled, 'compare')
  phases.push(compared)
  const delta = compareSnapshots(baseline, compared)
  const outcome = delta.added.length === 0 && delta.removed.length === 0
    ? 'PASS'
    : 'FAIL_LEAK'
  return receipt(
    options.runtime,
    options.fixture.name,
    configuration,
    phases,
    delta,
    errors,
    outcome,
  )
}
