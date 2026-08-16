import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type AuditOutcome,
  type AuditReceipt,
  EXIT_CODES,
  RECEIPT_SCHEMA_VERSION,
  SUPPORTED_RUNTIME,
} from '../src/contracts.js'

interface GateCase {
  fixture: string
  directory: string
  outcome: AuditOutcome
}

interface ChildResult {
  exitCode: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  timedOut: boolean
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/cli.js')
const cordisModule = resolve(
  process.env.DOCTOR_CORDIS_MODULE
    ?? resolve(projectRoot, '../deepseek-harness/vendor/cordis/lib/index.js'),
)
const evidenceRoot = resolve(projectRoot, 'artifacts/stage-2')

const cases: GateCase[] = [
  { fixture: 'clean', directory: 'clean-a', outcome: 'PASS' },
  { fixture: 'clean', directory: 'clean-b', outcome: 'PASS' },
  { fixture: 'leaky', directory: 'leaky', outcome: 'FAIL_LEAK' },
  { fixture: 'throwing-disposer', directory: 'throwing-disposer', outcome: 'FAIL_DISPOSE' },
  { fixture: 'hanging-disposer', directory: 'hanging-disposer', outcome: 'FAIL_TIMEOUT' },
  { fixture: 'startup-failure', directory: 'startup-failure', outcome: 'FAIL_MOUNT' },
  { fixture: 'unknown-version', directory: 'unknown-version', outcome: 'UNVERIFIABLE_VERSION' },
]

function scrubEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => {
    return !/(?:KEY|SECRET|TOKEN|PASSWORD|COOKIE)/i.test(name)
  }))
}

async function runChild(arguments_: string[]): Promise<ChildResult> {
  const child = spawn(process.execPath, arguments_, {
    cwd: projectRoot,
    env: scrubEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let stdout = ''
  let stderr = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  return new Promise((resolvePromise, reject) => {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, 5_000)
    child.once('error', reject)
    child.once('close', (exitCode, signal) => {
      clearTimeout(timer)
      resolvePromise({ exitCode, signal, stdout, stderr, timedOut })
    })
  })
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

function fail(code: string): never {
  process.stderr.write(`real gate failed: ${code}\n`)
  process.exit(1)
}

async function gitHead(): Promise<string> {
  const result = await runChild(['-e', `
    const { execFileSync } = require('node:child_process');
    process.stdout.write(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
  `])
  if (result.exitCode !== 0 || result.signal !== null || result.timedOut || result.stderr !== '') {
    return fail('SOURCE_COMMIT_UNVERIFIED')
  }
  if (!/^[a-f0-9]{40}$/.test(result.stdout)) return fail('SOURCE_COMMIT_INVALID')
  return result.stdout
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, path)
}

async function main(): Promise<void> {
  await mkdir(evidenceRoot, { recursive: true })
  const sourceCommit = await gitHead()
  const artifacts: Array<{
    fixture: string
    outcome: AuditOutcome
    exitCode: number
    receipt: string
    sha256: string
  }> = []

  for (const gateCase of cases) {
    const outputDirectory = resolve(evidenceRoot, gateCase.directory)
    const result = await runChild([
      cliPath,
      '--fixture', gateCase.fixture,
      '--cordis-module', cordisModule,
      '--out-dir', outputDirectory,
      '--operation-timeout-ms', '100',
      '--settle-window-ms', '60',
      '--settle-poll-ms', '10',
    ])
    if (result.timedOut) fail(`CHILD_TIMEOUT_${gateCase.fixture}`)
    if (result.signal !== null) fail(`CHILD_SIGNAL_${gateCase.fixture}`)
    if (result.stderr !== '') fail(`CHILD_STDERR_${gateCase.fixture}`)
    if (result.exitCode !== EXIT_CODES[gateCase.outcome]) fail(`EXIT_${gateCase.fixture}`)
    const receiptPath = resolve(outputDirectory, 'receipt.json')
    const receipt = JSON.parse(await readFile(receiptPath, 'utf8')) as AuditReceipt
    if (receipt.schemaVersion !== RECEIPT_SCHEMA_VERSION) fail(`SCHEMA_${gateCase.fixture}`)
    if (receipt.target.fixture !== gateCase.fixture) fail(`FIXTURE_${gateCase.fixture}`)
    if (receipt.outcome !== gateCase.outcome) fail(`OUTCOME_${gateCase.fixture}`)
    if (receipt.exitCode !== result.exitCode) fail(`RECEIPT_EXIT_${gateCase.fixture}`)
    if (receipt.runtime.packageName !== SUPPORTED_RUNTIME.packageName) fail(`PACKAGE_${gateCase.fixture}`)
    const expectedVersion = gateCase.fixture === 'unknown-version'
      ? '0.0.0'
      : SUPPORTED_RUNTIME.packageVersion
    if (receipt.runtime.packageVersion !== expectedVersion) fail(`VERSION_${gateCase.fixture}`)
    if (!/^[a-f0-9]{64}$/.test(receipt.runtime.sourceHash ?? '')) fail(`RUNTIME_HASH_${gateCase.fixture}`)
    artifacts.push({
      fixture: gateCase.fixture,
      outcome: gateCase.outcome,
      exitCode: result.exitCode,
      receipt: relative(projectRoot, receiptPath).replaceAll('\\', '/'),
      sha256: await sha256(receiptPath),
    })
  }

  if (artifacts[0]?.sha256 !== artifacts[1]?.sha256) fail('CLEAN_RECEIPT_NONDETERMINISTIC')
  const summaryPath = resolve(evidenceRoot, 'gate-summary.json')
  await atomicJson(summaryPath, {
    schemaVersion: 'stage-2-gate-v1',
    sourceCommit,
    runtimeModule: relative(projectRoot, cordisModule).replaceAll('\\', '/'),
    runtimeModuleSha256: await sha256(cordisModule),
    cleanReceiptsDeterministic: true,
    artifacts,
    outcome: 'PASS',
  })
  process.stdout.write(`${JSON.stringify({
    outcome: 'PASS',
    sourceCommit,
    summary: relative(projectRoot, summaryPath).replaceAll('\\', '/'),
    receipts: artifacts.length,
  })}\n`)
}

main().catch((error: unknown) => {
  const name = error instanceof Error && error.name.trim() !== '' ? error.name : 'UnknownError'
  process.stderr.write(`real gate failed: ${name}\n`)
  process.exitCode = 1
})
