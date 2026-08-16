import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, test } from 'node:test'
import {
  EXIT_CODES,
  RECEIPT_SCHEMA_VERSION,
  ReceiptViewerError,
  parseAuditReceiptJson,
  readReceiptSummary,
  type AuditReceipt,
} from '../src/index.js'

const temporaryDirectories: string[] = []

function sampleReceipt(): AuditReceipt {
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    runtime: {
      packageName: '@deepseek-ai/cordis',
      packageVersion: '4.0.1',
      modulePath: 'D:/private/runtime/cordis/lib/index.js',
      sourceHash: 'A'.repeat(64),
    },
    target: { fixture: 'clean' },
    configuration: { operationTimeoutMs: 100, settleWindowMs: 60, settlePollMs: 10 },
    phases: [{
      phase: 'baseline',
      resources: [{
        category: 'fiber',
        identity: 'fiber:root',
        label: 'root',
        owner: 'fiber:root',
        state: 'ACTIVE',
      }],
    }],
    delta: { added: [], removed: [] },
    errors: [],
    outcome: 'PASS',
    exitCode: EXIT_CODES.PASS,
    limitations: ['Cordis-managed resources only.'],
  }
}

async function temporaryFile(contents: string): Promise<string> {
  const parent = join(process.cwd(), '.tmp')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(join(parent, 'receipt-viewer-'))
  temporaryDirectories.push(directory)
  const path = join(directory, 'receipt.json')
  await writeFile(path, contents, 'utf8')
  return path
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

test('strictly validates and projects a receipt without its module path', async () => {
  const path = await temporaryFile(JSON.stringify(sampleReceipt()))
  const summary = await readReceiptSummary(path, 1024 * 1024)

  assert.equal(summary.outcome, 'PASS')
  assert.equal(summary.runtime.sourceHash, 'a'.repeat(64))
  assert.equal(summary.phaseCounts[0]?.total, 1)
  assert.equal(summary.phaseCounts[0]?.byCategory.fiber, 1)
  assert.equal('modulePath' in summary.runtime, false)
})

test('rejects unknown receipt fields instead of returning arbitrary JSON', () => {
  const receipt = { ...sampleReceipt(), sessionContent: 'must not escape' }
  assert.throws(
    () => parseAuditReceiptJson(JSON.stringify(receipt)),
    (error: unknown) => error instanceof ReceiptViewerError
      && error.code === 'RECEIPT_INVALID_SCHEMA'
      && !error.message.includes('must not escape'),
  )
})

test('rejects mismatched outcome exit codes', () => {
  const receipt = { ...sampleReceipt(), exitCode: EXIT_CODES.FAIL_LEAK }
  assert.throws(
    () => parseAuditReceiptJson(JSON.stringify(receipt)),
    (error: unknown) => error instanceof ReceiptViewerError && error.code === 'RECEIPT_INVALID_SCHEMA',
  )
})

test('enforces the byte cap before parsing', async () => {
  const path = await temporaryFile('x'.repeat(33))
  await assert.rejects(
    readReceiptSummary(path, 32),
    (error: unknown) => error instanceof ReceiptViewerError && error.code === 'RECEIPT_TOO_LARGE',
  )
})
