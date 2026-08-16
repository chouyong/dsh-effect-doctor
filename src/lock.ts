import { mkdir, open, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  type AuditReceipt,
  EXIT_CODES,
  RECEIPT_SCHEMA_VERSION,
} from './contracts.js'
import {
  type AuditConfiguration,
  type RunAuditOptions,
  runAudit,
} from './engine.js'

export class AuditLockedError extends Error {
  constructor(readonly lockPath: string) {
    super('another audit owns the configured lock')
    this.name = 'AuditLockedError'
  }
}

async function acquire(lockPath: string): Promise<() => Promise<void>> {
  await mkdir(dirname(lockPath), { recursive: true })
  let handle
  try {
    handle = await open(lockPath, 'wx', 0o600)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new AuditLockedError(lockPath)
    }
    throw error
  }
  await handle.writeFile(`${process.pid}\n`, 'utf8')
  let released = false
  return async () => {
    if (released) return
    released = true
    await handle.close()
    await unlink(lockPath)
  }
}

function lockedReceipt<Context, Fiber>(
  options: RunAuditOptions<Context, Fiber>,
): AuditReceipt {
  const defaults: AuditConfiguration = {
    operationTimeoutMs: 1_000,
    settleWindowMs: 250,
    settlePollMs: 25,
  }
  const configuration = { ...defaults, ...options.configuration }
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    runtime: options.runtime,
    target: { fixture: options.fixture.name },
    configuration,
    phases: [],
    delta: { added: [], removed: [] },
    errors: [{ phase: 'baseline', name: 'AuditLockedError', code: 'AUDIT_LOCKED' }],
    outcome: 'FAIL_LOCKED',
    exitCode: EXIT_CODES.FAIL_LOCKED,
    limitations: [
      'Audit did not start because another run owns the configured lock.',
    ],
  }
}

export async function runAuditWithLock<Context, Fiber>(
  lockPath: string,
  options: RunAuditOptions<Context, Fiber>,
): Promise<AuditReceipt> {
  let release: (() => Promise<void>) | undefined
  try {
    release = await acquire(lockPath)
  } catch (error) {
    if (error instanceof AuditLockedError) return lockedReceipt(options)
    throw error
  }
  try {
    return await runAudit(options)
  } finally {
    await release()
  }
}
