import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_RECEIPT_BYTES,
  TOOL_NAME,
  apply,
  createReceiptTool,
  type Config,
  type DshPluginContext,
} from '../src/dsh-plugin.js'

const config: Config = {
  receiptPath: 'D:\\dsh-home\\effect-doctor\\latest.json',
  maxBytes: 1024,
  timeoutMs: 250,
}

test('registers one zero-argument read-only tool', () => {
  let registered: Parameters<DshPluginContext['tools']['register']>[0] | undefined
  const ctx: DshPluginContext = {
    tools: {
      register(definition) {
        registered = definition
        return () => {}
      },
    },
  }

  apply(ctx, config)
  assert.equal(registered?.name, TOOL_NAME)
  assert.deepEqual(registered?.parameters, { type: 'object', properties: {} })
  assert.deepEqual(registered?.output.schema, {})
  assert.equal(registered?.timeoutMs, 250)
  assert.equal(registered?.isConcurrencySafe({}), true)
  assert.match(registered?.description ?? '', /does not run an audit/)
})

test('fails loud before registration for unsafe configuration', () => {
  assert.throws(
    () => createReceiptTool({ ...config, receiptPath: 'relative.json' }),
    /receiptPath must be absolute/,
  )
  assert.throws(
    () => createReceiptTool({ ...config, maxBytes: MAX_RECEIPT_BYTES + 1 }),
    /maxBytes must be an integer/,
  )
  assert.throws(
    () => createReceiptTool({ ...config, timeoutMs: 0 }),
    /timeoutMs must be an integer/,
  )
})
