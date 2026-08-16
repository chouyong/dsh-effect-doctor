import { isAbsolute } from 'node:path'
import Schema from '@deepseek-ai/schemastery'
import { readReceiptSummary, renderReceiptSummary, type ReceiptSummary } from './receipt-viewer.js'

export const name = 'effect-doctor-receipt'
export const inject = ['tools']
export const TOOL_NAME = 'effect_doctor_receipt'
export const MAX_RECEIPT_BYTES = 16 * 1024 * 1024

export interface Config {
  receiptPath: string
  maxBytes: number
  timeoutMs: number
}

export const Config: Schema<Config> = Schema.object({
  receiptPath: Schema.string().required(),
  maxBytes: Schema.natural().min(1).max(MAX_RECEIPT_BYTES).default(1024 * 1024),
  timeoutMs: Schema.natural().min(1).max(60_000).default(5_000),
})

interface ToolExecutionContext {
  readonly signal: AbortSignal
}

interface ToolDefinition {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
  readonly output: {
    readonly schema: Record<string, unknown>
    render(args: unknown, value: ReceiptSummary): Array<{ type: 'text'; text: string }>
  }
  readonly timeoutMs: number
  isConcurrencySafe(args: unknown): boolean
  execute(args: unknown, exec: ToolExecutionContext): Promise<ReceiptSummary>
}

interface ToolRegistry {
  register(definition: ToolDefinition): () => void
}

export interface DshPluginContext {
  readonly tools: ToolRegistry
}

function resolveConfig(config: Config): Config {
  if (!isAbsolute(config.receiptPath)) {
    throw new Error('effect-doctor receiptPath must be absolute')
  }
  if (!Number.isSafeInteger(config.maxBytes) || config.maxBytes < 1 || config.maxBytes > MAX_RECEIPT_BYTES) {
    throw new Error(`effect-doctor maxBytes must be an integer from 1 to ${MAX_RECEIPT_BYTES}`)
  }
  if (!Number.isSafeInteger(config.timeoutMs) || config.timeoutMs < 1 || config.timeoutMs > 60_000) {
    throw new Error('effect-doctor timeoutMs must be an integer from 1 to 60000')
  }
  return { ...config }
}

/** Create the host-only tool that displays an already-completed receipt. */
export function createReceiptTool(config: Config): ToolDefinition {
  const resolved = resolveConfig(config)
  return {
    name: TOOL_NAME,
    description:
      'Read the configured completed dsh-effect-doctor receipt and return its validated summary. '
      + 'This read-only tool does not run an audit, unload plugins, or inspect session content.',
    parameters: { type: 'object', properties: {} },
    output: {
      schema: {},
      render: (_args, value) => [{ type: 'text', text: renderReceiptSummary(value) }],
    },
    timeoutMs: resolved.timeoutMs,
    isConcurrencySafe: () => true,
    execute: (_args, exec) => readReceiptSummary(resolved.receiptPath, resolved.maxBytes, exec.signal),
  }
}

/** Register the receipt viewer with DSH's effect-owned ToolRuntime. */
export function apply(ctx: DshPluginContext, config: Config): void {
  ctx.tools.register(createReceiptTool(config))
}
