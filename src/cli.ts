#!/usr/bin/env node

import { resolve } from 'node:path'
import { CordisV401Adapter, type CordisContextLike } from './cordis-adapter.js'
import type { AuditFixture } from './contracts.js'
import { getFixture } from './fixtures.js'
import { runAuditWithLock } from './lock.js'
import { writeReceiptFiles } from './report.js'
import { loadCordisRuntime } from './runtime-loader.js'

interface CliOptions {
  fixture: string
  cordisModule: string
  outputDirectory: string
  lockPath: string
  operationTimeoutMs: number
  settleWindowMs: number
  settlePollMs: number
}

const HELP = `dsh-effect-doctor

Usage:
  dsh-effect-doctor --fixture <name> --cordis-module <path-or-package> [options]

Fixtures:
  clean | leaky | throwing-disposer | hanging-disposer | startup-failure | unknown-version

Options:
  --out-dir <path>              Receipt directory (default: artifacts/latest)
  --lock-file <path>            Single-run lock (default: <out-dir>/.doctor.lock)
  --operation-timeout-ms <n>    Mount/exercise/unmount ceiling (default: 1000)
  --settle-window-ms <n>        Snapshot stability window (default: 250)
  --settle-poll-ms <n>          Snapshot poll interval (default: 25)
  --help                        Show this help
`

function positiveInteger(value: string | undefined, name: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(`${name} must be a positive integer`)
  }
  return parsed
}

function parseArgs(argv: string[]): CliOptions | undefined {
  if (argv.includes('--help')) return
  const values = new Map<string, string>()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (key === undefined || !key.startsWith('--') || value === undefined || value.startsWith('--')) {
      throw new RangeError('arguments must be --name value pairs')
    }
    values.set(key, value)
  }
  const fixture = values.get('--fixture') ?? 'clean'
  const cordisModule = values.get('--cordis-module')
    ?? process.env.DOCTOR_CORDIS_MODULE
    ?? '@deepseek-ai/cordis'
  const outputDirectory = resolve(values.get('--out-dir') ?? 'artifacts/latest')
  return {
    fixture,
    cordisModule,
    outputDirectory,
    lockPath: resolve(values.get('--lock-file') ?? `${outputDirectory}/.doctor.lock`),
    operationTimeoutMs: positiveInteger(values.get('--operation-timeout-ms') ?? '1000', 'operation timeout'),
    settleWindowMs: positiveInteger(values.get('--settle-window-ms') ?? '250', 'settle window'),
    settlePollMs: positiveInteger(values.get('--settle-poll-ms') ?? '25', 'settle poll'),
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options === undefined) {
    process.stdout.write(HELP)
    return
  }
  const loaded = await loadCordisRuntime(
    options.cordisModule,
    options.fixture === 'unknown-version' ? '0.0.0' : undefined,
  )
  const fixture = getFixture(options.fixture) as unknown as AuditFixture<CordisContextLike>
  const result = await runAuditWithLock(options.lockPath, {
    adapter: new CordisV401Adapter(),
    context: loaded.context,
    fixture,
    runtime: loaded.identity,
    configuration: {
      operationTimeoutMs: options.operationTimeoutMs,
      settleWindowMs: options.settleWindowMs,
      settlePollMs: options.settlePollMs,
    },
  })
  await writeReceiptFiles(options.outputDirectory, result)
  process.stdout.write(`${JSON.stringify({
    fixture: result.target.fixture,
    outcome: result.outcome,
    exitCode: result.exitCode,
    outputDirectory: options.outputDirectory,
  })}\n`)
  process.exitCode = result.exitCode
}

main().catch((error: unknown) => {
  const name = error instanceof Error && error.name.trim() !== '' ? error.name : 'UnknownError'
  process.stderr.write(`dsh-effect-doctor failed: ${name}\n`)
  process.exitCode = 31
})
