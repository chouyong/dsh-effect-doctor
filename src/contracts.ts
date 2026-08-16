export const RECEIPT_SCHEMA_VERSION = '1.0.0' as const

export const SUPPORTED_RUNTIME = {
  packageName: '@deepseek-ai/cordis',
  packageVersion: '4.0.1',
} as const

export type AuditOutcome =
  | 'PASS'
  | 'FAIL_LEAK'
  | 'FAIL_DISPOSE'
  | 'FAIL_TIMEOUT'
  | 'FAIL_MOUNT'
  | 'FAIL_EXERCISE'
  | 'FAIL_LOCKED'
  | 'UNVERIFIABLE_VERSION'
  | 'UNVERIFIABLE_SURFACE'

export const EXIT_CODES = {
  PASS: 0,
  FAIL_LEAK: 20,
  FAIL_DISPOSE: 21,
  FAIL_TIMEOUT: 22,
  FAIL_MOUNT: 23,
  FAIL_EXERCISE: 24,
  FAIL_LOCKED: 25,
  UNVERIFIABLE_VERSION: 30,
  UNVERIFIABLE_SURFACE: 31,
} as const satisfies Record<AuditOutcome, number>

export type AuditPhase =
  | 'baseline'
  | 'mount'
  | 'exercise'
  | 'unmount'
  | 'settle'
  | 'compare'

export type ResourceCategory =
  | 'fiber'
  | 'runtime'
  | 'effect'
  | 'listener'
  | 'service'

export interface RuntimeIdentity {
  packageName: string
  packageVersion: string
  modulePath: string
  sourceHash?: string
}

export interface ResourceRecord {
  category: ResourceCategory
  identity: string
  label: string
  owner: string
  state?: string
}

export interface ResourceSnapshot {
  phase: AuditPhase
  resources: ResourceRecord[]
}

export interface SnapshotDelta {
  added: ResourceRecord[]
  removed: ResourceRecord[]
}

export interface ErrorSummary {
  phase: AuditPhase
  name: string
  code?: string
}

export interface SupportFailure {
  supported: false
  outcome: 'UNVERIFIABLE_VERSION' | 'UNVERIFIABLE_SURFACE'
  reason: string
}

export interface SupportSuccess {
  supported: true
}

export type SupportResult = SupportSuccess | SupportFailure

export interface AuditReceipt {
  schemaVersion: typeof RECEIPT_SCHEMA_VERSION
  runtime: RuntimeIdentity
  target: {
    fixture: string
  }
  configuration: {
    operationTimeoutMs: number
    settleWindowMs: number
    settlePollMs: number
  }
  phases: ResourceSnapshot[]
  delta: SnapshotDelta
  errors: ErrorSummary[]
  outcome: AuditOutcome
  exitCode: number
  limitations: string[]
}

export interface AuditAdapter<Context = unknown, Fiber = unknown> {
  probe(context: Context, runtime: RuntimeIdentity): SupportResult
  snapshot(context: Context, phase: AuditPhase): ResourceSnapshot
  mount(context: Context, plugin: unknown): Fiber & PromiseLike<Fiber>
  dispose(fiber: Fiber): Promise<void>
  errorCursor(context: Context): number
  errorsSince(context: Context, cursor: number, phase: AuditPhase): ErrorSummary[]
}

export interface AuditFixture<Context = unknown> {
  name: string
  plugin: unknown
  exercise?: (context: Context, signal: AbortSignal) => void | Promise<void>
}
