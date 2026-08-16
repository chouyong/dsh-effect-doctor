import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  type AuditAdapter,
  type AuditFixture,
  type AuditPhase,
  type ErrorSummary,
  type ResourceSnapshot,
  type RuntimeIdentity,
  runAudit,
  runAuditWithLock,
  serializeReceipt,
  type SupportResult,
} from '../src/index.js'

interface FakeFiber {
  dispose(): void | Promise<void>
}

interface FakeContext {
  resources: Set<string>
  loggedErrors: number
  snapshotCount: number
}

interface FakePlugin {
  mount(context: FakeContext): FakeFiber | PromiseLike<FakeFiber>
}

const runtime: RuntimeIdentity = {
  packageName: '@deepseek-ai/cordis',
  packageVersion: '4.0.1',
  modulePath: 'fake://cordis',
}

function record(name: string) {
  return {
    category: 'effect' as const,
    identity: `resource:${name}`,
    label: name,
    owner: 'fiber:1',
  }
}

class FakeAdapter implements AuditAdapter<FakeContext, FakeFiber> {
  support: SupportResult = { supported: true }
  snapshotMutation?: (context: FakeContext, phase: AuditPhase) => void

  probe(): SupportResult {
    return this.support
  }

  snapshot(context: FakeContext, phase: AuditPhase): ResourceSnapshot {
    context.snapshotCount += 1
    this.snapshotMutation?.(context, phase)
    return {
      phase,
      resources: [...context.resources].sort().map(record),
    }
  }

  mount(context: FakeContext, plugin: unknown): FakeFiber & PromiseLike<FakeFiber> {
    const task = Promise.resolve((plugin as FakePlugin).mount(context))
    const placeholder: FakeFiber & PromiseLike<FakeFiber> = {
      dispose: async () => (await task).dispose(),
      then: (onFulfilled, onRejected) => task.then(onFulfilled, onRejected),
    }
    return placeholder
  }

  async dispose(fiber: FakeFiber): Promise<void> {
    await fiber.dispose()
  }

  errorCursor(context: FakeContext): number {
    return context.loggedErrors
  }

  errorsSince(context: FakeContext, cursor: number, phase: AuditPhase): ErrorSummary[] {
    return Array.from({ length: context.loggedErrors - cursor }, () => ({
      phase,
      name: 'Error',
    }))
  }
}

function context(): FakeContext {
  return { resources: new Set(), loggedErrors: 0, snapshotCount: 0 }
}

function fixture(name: string, mount: FakePlugin['mount']): AuditFixture<FakeContext> {
  return { name, plugin: { mount } }
}

const configuration = {
  operationTimeoutMs: 50,
  settleWindowMs: 30,
  settlePollMs: 5,
}

test('clean resources return to baseline', async () => {
  const target = context()
  const result = await runAudit({
    adapter: new FakeAdapter(),
    context: target,
    runtime,
    configuration,
    fixture: fixture('clean', (value) => {
      value.resources.add('target')
      return { dispose: () => { value.resources.delete('target') } }
    }),
  })
  assert.equal(result.outcome, 'PASS')
  assert.deepEqual(result.delta, { added: [], removed: [] })
})

test('retained declared resources fail as leaks', async () => {
  const target = context()
  const result = await runAudit({
    adapter: new FakeAdapter(),
    context: target,
    runtime,
    configuration,
    fixture: fixture('leaky', (value) => {
      value.resources.add('target')
      value.resources.add('retained')
      return { dispose: () => { value.resources.delete('target') } }
    }),
  })
  assert.equal(result.outcome, 'FAIL_LEAK')
  assert.deepEqual(result.delta.added.map(item => item.label), ['retained'])
})

test('dispose rejection, logged dispose error, and timeout stay distinct', async () => {
  const throwing = await runAudit({
    adapter: new FakeAdapter(),
    context: context(),
    runtime,
    configuration,
    fixture: fixture('throwing', () => ({ dispose: () => { throw new Error('private') } })),
  })
  const loggedContext = context()
  const logged = await runAudit({
    adapter: new FakeAdapter(),
    context: loggedContext,
    runtime,
    configuration,
    fixture: fixture('logged', () => ({ dispose: () => { loggedContext.loggedErrors += 1 } })),
  })
  const hanging = await runAudit({
    adapter: new FakeAdapter(),
    context: context(),
    runtime,
    configuration,
    fixture: fixture('hanging', () => ({ dispose: () => new Promise<void>(() => undefined) })),
  })
  assert.equal(throwing.outcome, 'FAIL_DISPOSE')
  assert.equal(logged.outcome, 'FAIL_DISPOSE')
  assert.equal(hanging.outcome, 'FAIL_TIMEOUT')
  assert.doesNotMatch(serializeReceipt(throwing), /private/)
})

test('mount, exercise, version, and surface failures fail closed', async () => {
  const mount = await runAudit({
    adapter: new FakeAdapter(),
    context: context(),
    runtime,
    configuration,
    fixture: fixture('mount', () => { throw new Error('mount') }),
  })
  const exercise = await runAudit({
    adapter: new FakeAdapter(),
    context: context(),
    runtime,
    configuration,
    fixture: {
      ...fixture('exercise', () => ({ dispose: () => undefined })),
      exercise: () => { throw new Error('exercise') },
    },
  })
  const versionAdapter = new FakeAdapter()
  versionAdapter.support = {
    supported: false,
    outcome: 'UNVERIFIABLE_VERSION',
    reason: 'version',
  }
  const version = await runAudit({
    adapter: versionAdapter,
    context: context(),
    runtime,
    configuration,
    fixture: fixture('version', () => ({ dispose: () => undefined })),
  })
  const surfaceAdapter = new FakeAdapter()
  surfaceAdapter.support = {
    supported: false,
    outcome: 'UNVERIFIABLE_SURFACE',
    reason: 'surface',
  }
  const surface = await runAudit({
    adapter: surfaceAdapter,
    context: context(),
    runtime,
    configuration,
    fixture: fixture('surface', () => ({ dispose: () => undefined })),
  })
  assert.equal(mount.outcome, 'FAIL_MOUNT')
  assert.equal(exercise.outcome, 'FAIL_EXERCISE')
  assert.equal(version.outcome, 'UNVERIFIABLE_VERSION')
  assert.equal(surface.outcome, 'UNVERIFIABLE_SURFACE')
})

test('unstable settle snapshots time out', async () => {
  const adapter = new FakeAdapter()
  adapter.snapshotMutation = (value, phase) => {
    if (phase !== 'settle') return
    if (value.snapshotCount % 2 === 0) value.resources.add('race')
    else value.resources.delete('race')
  }
  const result = await runAudit({
    adapter,
    context: context(),
    runtime,
    configuration,
    fixture: fixture('race', () => ({ dispose: () => undefined })),
  })
  assert.equal(result.outcome, 'FAIL_TIMEOUT')
})

test('exercise timeout still disposes the mounted fiber', async () => {
  const cleanContext = context()
  cleanContext.resources.add('baseline')
  let disposeCalls = 0
  const cleanResult = await runAudit({
    adapter: new FakeAdapter(),
    context: cleanContext,
    runtime,
    configuration: { ...configuration, operationTimeoutMs: 10 },
    fixture: {
      ...fixture('exercise-timeout-cleanup', (value) => {
        value.resources.add('mounted')
        return {
          dispose: () => {
            disposeCalls += 1
            value.resources.delete('mounted')
          },
        }
      }),
      exercise: () => new Promise<void>(() => {}),
    },
  })
  assert.equal(cleanResult.outcome, 'FAIL_TIMEOUT')
  assert.equal(disposeCalls, 1)
  assert.equal(cleanContext.resources.has('mounted'), false)
  assert.ok(cleanResult.phases.some(phase => phase.phase === 'unmount'))

  const rejectingResult = await runAudit({
    adapter: new FakeAdapter(),
    context: context(),
    runtime,
    configuration: { ...configuration, operationTimeoutMs: 10 },
    fixture: {
      ...fixture('exercise-timeout-dispose-failure', () => ({
        dispose: () => { throw new Error('dispose') },
      })),
      exercise: () => new Promise<void>(() => {}),
    },
  })
  assert.equal(rejectingResult.outcome, 'FAIL_DISPOSE')
  assert.ok(rejectingResult.errors.some(error => error.phase === 'unmount'))
})

test('existing single-run lock fails without mounting', async () => {
  const directory = join('.tmp', `lock-test-${process.pid}`)
  const lockPath = join(directory, 'doctor.lock')
  await mkdir(directory, { recursive: true })
  await writeFile(lockPath, 'owned\n', 'utf8')
  let mounted = false
  try {
    const result = await runAuditWithLock(lockPath, {
      adapter: new FakeAdapter(),
      context: context(),
      runtime,
      configuration,
      fixture: fixture('locked', () => {
        mounted = true
        return { dispose: () => undefined }
      }),
    })
    assert.equal(result.outcome, 'FAIL_LOCKED')
    assert.equal(mounted, false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
