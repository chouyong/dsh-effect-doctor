import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EXIT_CODES,
  type AuditReceipt,
  RECEIPT_SCHEMA_VERSION,
  renderHtml,
  renderMarkdown,
  serializeReceipt,
} from '../src/index.js'

function sampleReceipt(): AuditReceipt {
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    runtime: {
      packageName: '@deepseek-ai/cordis',
      packageVersion: '4.0.1',
      modulePath: 'D:/runtime/cordis/lib/index.js',
      sourceHash: 'a'.repeat(64),
    },
    target: { fixture: 'clean' },
    configuration: {
      operationTimeoutMs: 100,
      settleWindowMs: 60,
      settlePollMs: 10,
    },
    phases: [{
      phase: 'baseline',
      resources: [{
        category: 'fiber',
        identity: 'fiber:root',
        label: 'root',
        owner: 'fiber:root',
        state: 'active',
      }],
    }],
    delta: { added: [], removed: [] },
    errors: [],
    outcome: 'PASS',
    exitCode: EXIT_CODES.PASS,
    limitations: ['Cordis-managed resources only.'],
  }
}

test('every non-pass outcome has a non-zero exit code', () => {
  for (const [outcome, exitCode] of Object.entries(EXIT_CODES)) {
    assert.equal(exitCode === 0, outcome === 'PASS')
  }
})

test('receipt serialization is deterministic and time-free', () => {
  const receipt = sampleReceipt()
  const first = serializeReceipt(receipt)
  const second = serializeReceipt(structuredClone(receipt))
  assert.equal(first, second)
  assert.doesNotMatch(first, /timestamp|startedAt|finishedAt|durationMs/)
})

test('Markdown and HTML render the receipt without active content', () => {
  const receipt = sampleReceipt()
  const markdown = renderMarkdown(receipt)
  const html = renderHtml(receipt)
  assert.match(markdown, /Outcome: `PASS`/)
  assert.match(html, /<!doctype html>/)
  assert.match(html, /PASS \/ exit 0/)
  assert.doesNotMatch(html, /<script|onerror=|javascript:/i)
})
