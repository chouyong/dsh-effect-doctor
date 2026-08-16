import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import {
  type AuditFixture,
  CordisV401Adapter,
  type CordisContextLike,
  getFixture,
  loadCordisRuntime,
  runAudit,
  serializeReceipt,
} from '../src/index.js'

const modulePath = resolve(
  process.env.DOCTOR_CORDIS_MODULE
    ?? '../deepseek-harness/vendor/cordis/lib/index.js',
)

const configuration = {
  operationTimeoutMs: 100,
  settleWindowMs: 60,
  settlePollMs: 10,
}

async function audit(name: string) {
  const loaded = await loadCordisRuntime(modulePath, name === 'unknown-version' ? '0.0.0' : undefined)
  return runAudit({
    adapter: new CordisV401Adapter(),
    context: loaded.context,
    runtime: loaded.identity,
    configuration,
    fixture: getFixture(name) as unknown as AuditFixture<CordisContextLike>,
  })
}

test('real runtime identity is pinned and hashed', async () => {
  const loaded = await loadCordisRuntime(pathToFileURL(modulePath).href)
  assert.equal(loaded.identity.packageName, '@deepseek-ai/cordis')
  assert.equal(loaded.identity.packageVersion, '4.0.1')
  assert.match(loaded.identity.sourceHash ?? '', /^[a-f0-9]{64}$/)
})

test('real adapter snapshots are read-only and stable', async () => {
  const loaded = await loadCordisRuntime(modulePath)
  const adapter = new CordisV401Adapter()
  assert.deepEqual(adapter.probe(loaded.context, loaded.identity), { supported: true })
  const first = adapter.snapshot(loaded.context, 'baseline')
  const second = adapter.snapshot(loaded.context, 'baseline')
  assert.deepEqual(first, second)
})

test('real fixtures produce the preregistered outcomes', async () => {
  const expected = {
    clean: 'PASS',
    leaky: 'FAIL_LEAK',
    'throwing-disposer': 'FAIL_DISPOSE',
    'hanging-disposer': 'FAIL_TIMEOUT',
    'startup-failure': 'FAIL_MOUNT',
    'unknown-version': 'UNVERIFIABLE_VERSION',
  } as const
  for (const [name, outcome] of Object.entries(expected)) {
    const result = await audit(name)
    assert.equal(result.outcome, outcome, name)
    if (name === 'throwing-disposer') {
      assert.doesNotMatch(serializeReceipt(result), /doctor fixture disposer failed/)
    }
  }
})

test('real adapter fails closed when private event projection drifts', async () => {
  const loaded = await loadCordisRuntime(modulePath)
  const drifted = Object.create(loaded.context) as CordisContextLike
  drifted.events = {} as CordisContextLike['events']
  const support = new CordisV401Adapter().probe(drifted, loaded.identity)
  assert.equal(support.supported, false)
  if (!support.supported) assert.equal(support.outcome, 'UNVERIFIABLE_SURFACE')
})
