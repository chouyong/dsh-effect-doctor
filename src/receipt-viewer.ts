import { open, type FileHandle } from 'node:fs/promises'
import {
  EXIT_CODES,
  RECEIPT_SCHEMA_VERSION,
  type AuditOutcome,
  type AuditPhase,
  type AuditReceipt,
  type ErrorSummary,
  type ResourceCategory,
  type ResourceRecord,
} from './contracts.js'

const AUDIT_OUTCOMES = new Set<AuditOutcome>(Object.keys(EXIT_CODES) as AuditOutcome[])
const AUDIT_PHASES = new Set<AuditPhase>(['baseline', 'mount', 'exercise', 'unmount', 'settle', 'compare'])
const RESOURCE_CATEGORIES = new Set<ResourceCategory>(['fiber', 'runtime', 'effect', 'listener', 'service'])

export type ReceiptViewerErrorCode =
  | 'RECEIPT_READ_FAILED'
  | 'RECEIPT_TOO_LARGE'
  | 'RECEIPT_INVALID_UTF8'
  | 'RECEIPT_INVALID_JSON'
  | 'RECEIPT_INVALID_SCHEMA'

/** A sanitized receipt read or validation failure. */
export class ReceiptViewerError extends Error {
  /** Stable machine code suitable for tool error handling. */
  readonly code: ReceiptViewerErrorCode

  /** Create a receipt viewer error without embedding file contents. */
  constructor(code: ReceiptViewerErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ReceiptViewerError'
    this.code = code
  }
}

export interface ReceiptPhaseCounts {
  phase: AuditPhase
  total: number
  byCategory: Record<ResourceCategory, number>
}

/** Model-safe projection of one validated receipt. */
export interface ReceiptSummary {
  schemaVersion: typeof RECEIPT_SCHEMA_VERSION
  runtime: {
    packageName: string
    packageVersion: string
    sourceHash?: string
  }
  target: {
    fixture: string
  }
  configuration: AuditReceipt['configuration']
  phaseCounts: ReceiptPhaseCounts[]
  delta: AuditReceipt['delta']
  errors: ErrorSummary[]
  outcome: AuditOutcome
  exitCode: number
  limitations: string[]
}

function invalid(path: string): never {
  throw new ReceiptViewerError('RECEIPT_INVALID_SCHEMA', `${path} is invalid.`)
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid(path)
  return value as Record<string, unknown>
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedKeys = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) invalid(`${path}.${key}`)
  }
  for (const key of allowed) {
    if (!(key in value)) invalid(`${path}.${key}`)
  }
}

function exactKeysWithOptional(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): void {
  const allowed = new Set([...required, ...optional])
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) invalid(`${path}.${key}`)
  }
  for (const key of required) {
    if (!(key in value)) invalid(`${path}.${key}`)
  }
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) invalid(path)
  return value
}

function integerValue(value: unknown, path: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) invalid(path)
  return value as number
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) invalid(path)
  return value.map((item, index) => stringValue(item, `${path}[${index}]`))
}

function resource(value: unknown, path: string): ResourceRecord {
  const item = record(value, path)
  exactKeysWithOptional(item, ['category', 'identity', 'label', 'owner'], ['state'], path)
  const category = stringValue(item.category, `${path}.category`) as ResourceCategory
  if (!RESOURCE_CATEGORIES.has(category)) invalid(`${path}.category`)
  return {
    category,
    identity: stringValue(item.identity, `${path}.identity`),
    label: stringValue(item.label, `${path}.label`),
    owner: stringValue(item.owner, `${path}.owner`),
    ...item.state === undefined ? {} : { state: stringValue(item.state, `${path}.state`) },
  }
}

function resources(value: unknown, path: string): ResourceRecord[] {
  if (!Array.isArray(value)) invalid(path)
  return value.map((item, index) => resource(item, `${path}[${index}]`))
}

function parseReceipt(value: unknown): AuditReceipt {
  const receipt = record(value, 'receipt')
  exactKeys(receipt, [
    'schemaVersion',
    'runtime',
    'target',
    'configuration',
    'phases',
    'delta',
    'errors',
    'outcome',
    'exitCode',
    'limitations',
  ], 'receipt')

  if (receipt.schemaVersion !== RECEIPT_SCHEMA_VERSION) invalid('receipt.schemaVersion')

  const runtime = record(receipt.runtime, 'receipt.runtime')
  exactKeysWithOptional(runtime, ['packageName', 'packageVersion', 'modulePath'], ['sourceHash'], 'receipt.runtime')
  const sourceHash = runtime.sourceHash === undefined
    ? undefined
    : stringValue(runtime.sourceHash, 'receipt.runtime.sourceHash').toLowerCase()
  if (sourceHash !== undefined && !/^[0-9a-f]{64}$/.test(sourceHash)) invalid('receipt.runtime.sourceHash')

  const target = record(receipt.target, 'receipt.target')
  exactKeys(target, ['fixture'], 'receipt.target')

  const configuration = record(receipt.configuration, 'receipt.configuration')
  exactKeys(configuration, ['operationTimeoutMs', 'settleWindowMs', 'settlePollMs'], 'receipt.configuration')

  if (!Array.isArray(receipt.phases)) invalid('receipt.phases')
  const phases = receipt.phases.map((value, index) => {
    const phase = record(value, `receipt.phases[${index}]`)
    exactKeys(phase, ['phase', 'resources'], `receipt.phases[${index}]`)
    const phaseName = stringValue(phase.phase, `receipt.phases[${index}].phase`) as AuditPhase
    if (!AUDIT_PHASES.has(phaseName)) invalid(`receipt.phases[${index}].phase`)
    return {
      phase: phaseName,
      resources: resources(phase.resources, `receipt.phases[${index}].resources`),
    }
  })

  const delta = record(receipt.delta, 'receipt.delta')
  exactKeys(delta, ['added', 'removed'], 'receipt.delta')

  if (!Array.isArray(receipt.errors)) invalid('receipt.errors')
  const errors = receipt.errors.map((value, index) => {
    const error = record(value, `receipt.errors[${index}]`)
    exactKeysWithOptional(error, ['phase', 'name'], ['code'], `receipt.errors[${index}]`)
    const phase = stringValue(error.phase, `receipt.errors[${index}].phase`) as AuditPhase
    if (!AUDIT_PHASES.has(phase)) invalid(`receipt.errors[${index}].phase`)
    return {
      phase,
      name: stringValue(error.name, `receipt.errors[${index}].name`),
      ...error.code === undefined ? {} : { code: stringValue(error.code, `receipt.errors[${index}].code`) },
    }
  })

  const outcome = stringValue(receipt.outcome, 'receipt.outcome') as AuditOutcome
  if (!AUDIT_OUTCOMES.has(outcome)) invalid('receipt.outcome')
  const exitCode = integerValue(receipt.exitCode, 'receipt.exitCode')
  if (exitCode !== EXIT_CODES[outcome]) invalid('receipt.exitCode')

  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    runtime: {
      packageName: stringValue(runtime.packageName, 'receipt.runtime.packageName'),
      packageVersion: stringValue(runtime.packageVersion, 'receipt.runtime.packageVersion'),
      modulePath: stringValue(runtime.modulePath, 'receipt.runtime.modulePath'),
      ...sourceHash === undefined ? {} : { sourceHash },
    },
    target: { fixture: stringValue(target.fixture, 'receipt.target.fixture') },
    configuration: {
      operationTimeoutMs: integerValue(configuration.operationTimeoutMs, 'receipt.configuration.operationTimeoutMs', 1),
      settleWindowMs: integerValue(configuration.settleWindowMs, 'receipt.configuration.settleWindowMs'),
      settlePollMs: integerValue(configuration.settlePollMs, 'receipt.configuration.settlePollMs', 1),
    },
    phases,
    delta: {
      added: resources(delta.added, 'receipt.delta.added'),
      removed: resources(delta.removed, 'receipt.delta.removed'),
    },
    errors,
    outcome,
    exitCode,
    limitations: stringArray(receipt.limitations, 'receipt.limitations'),
  }
}

/** Parse and strictly validate a dsh-effect-doctor JSON receipt. */
export function parseAuditReceiptJson(text: string): AuditReceipt {
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch (cause) {
    throw new ReceiptViewerError('RECEIPT_INVALID_JSON', 'Configured receipt is not valid JSON.', { cause })
  }
  return parseReceipt(value)
}

function emptyCategoryCounts(): Record<ResourceCategory, number> {
  return { fiber: 0, runtime: 0, effect: 0, listener: 0, service: 0 }
}

/** Project a validated receipt without its host filesystem path. */
export function summarizeReceipt(receipt: AuditReceipt): ReceiptSummary {
  return {
    schemaVersion: receipt.schemaVersion,
    runtime: {
      packageName: receipt.runtime.packageName,
      packageVersion: receipt.runtime.packageVersion,
      ...receipt.runtime.sourceHash === undefined ? {} : { sourceHash: receipt.runtime.sourceHash },
    },
    target: { fixture: receipt.target.fixture },
    configuration: { ...receipt.configuration },
    phaseCounts: receipt.phases.map(snapshot => {
      const byCategory = emptyCategoryCounts()
      for (const resource of snapshot.resources) byCategory[resource.category] += 1
      return { phase: snapshot.phase, total: snapshot.resources.length, byCategory }
    }),
    delta: {
      added: receipt.delta.added.map(item => ({ ...item })),
      removed: receipt.delta.removed.map(item => ({ ...item })),
    },
    errors: receipt.errors.map(error => ({ ...error })),
    outcome: receipt.outcome,
    exitCode: receipt.exitCode,
    limitations: [...receipt.limitations],
  }
}

async function readBoundedUtf8File(path: string, maxBytes: number, signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted()
  let file: FileHandle | undefined
  try {
    file = await open(path, 'r')
    const buffer = Buffer.allocUnsafe(maxBytes + 1)
    let offset = 0
    while (offset < buffer.length) {
      signal?.throwIfAborted()
      const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, offset)
      if (bytesRead === 0) break
      offset += bytesRead
    }
    if (offset > maxBytes) {
      throw new ReceiptViewerError('RECEIPT_TOO_LARGE', 'Configured receipt exceeds the byte limit.')
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, offset))
    } catch (cause) {
      throw new ReceiptViewerError('RECEIPT_INVALID_UTF8', 'Configured receipt is not valid UTF-8.', { cause })
    }
  } catch (cause) {
    if (cause instanceof ReceiptViewerError) throw cause
    throw new ReceiptViewerError('RECEIPT_READ_FAILED', 'Configured receipt could not be read.', { cause })
  } finally {
    await file?.close()
  }
}

/** Read, validate, and sanitize one completed receipt. */
export async function readReceiptSummary(
  path: string,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<ReceiptSummary> {
  return summarizeReceipt(parseAuditReceiptJson(await readBoundedUtf8File(path, maxBytes, signal)))
}

/** Render the exact canonical summary shown to a DSH tool consumer. */
export function renderReceiptSummary(summary: ReceiptSummary): string {
  return JSON.stringify(summary, null, 2)
}
