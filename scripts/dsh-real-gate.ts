import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { isAbsolute, join, parse, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { TOOL_NAME } from '../src/dsh-plugin.js'
import { readReceiptSummary, renderReceiptSummary, type ReceiptSummary } from '../src/receipt-viewer.js'

const GATE_SCHEMA_VERSION = 'stage3-dsh-gate-v1' as const

interface Options {
  dshSource: string
  dshHome: string
  profile: string
  receipt: string
  tarball: string
  outputDirectory: string
}

interface ToolDefinition {
  readonly output: {
    readonly schema: unknown
    render(args: unknown, value: ReceiptSummary): Array<{ type: string; text?: string }>
  }
  execute(args: unknown, exec: { signal: AbortSignal }): Promise<ReceiptSummary>
}

interface ToolRuntimeLike {
  get(name: string): ToolDefinition | undefined
}

interface FiberLike {
  readonly uid: number | null
  dispose(): Promise<void>
}

interface EntryLike {
  readonly fiber?: FiberLike
}

interface DshContextLike {
  readonly fiber: FiberLike
  readonly loader: {
    resolve(id: string): EntryLike
  }
  get(name: string): unknown
}

interface AppBootModule {
  boot(binName: string, absoluteConfigPath: string): Promise<DshContextLike>
}

interface ToolsModule {
  validateJsonSchemaValue(schema: unknown, value: unknown, path?: string): string[]
}

interface ProfileManifest {
  dependencies?: Record<string, string>
  dsh?: {
    profile?: {
      bundles?: string[]
    }
  }
}

function help(): string {
  return `dsh-effect-doctor Stage 3 DSH gate

Usage:
  node dist/scripts/dsh-real-gate.js \
    --dsh-source <absolute-path> \
    --dsh-home <absolute-path> \
    --profile <name> \
    --receipt <absolute-path> \
    --tarball <absolute-path> \
    --out-dir <absolute-path>
`
}

function parseArgs(argv: string[]): Options | undefined {
  if (argv.includes('--help')) return undefined
  const values = new Map<string, string>()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (key === undefined || !key.startsWith('--') || value === undefined || value.startsWith('--')) {
      throw new RangeError('arguments must be --name value pairs')
    }
    if (values.has(key)) throw new RangeError(`duplicate argument ${key}`)
    values.set(key, value)
  }
  const required = ['--dsh-source', '--dsh-home', '--profile', '--receipt', '--tarball', '--out-dir'] as const
  for (const key of required) {
    if (!values.has(key)) throw new RangeError(`missing argument ${key}`)
  }
  if (values.size !== required.length) throw new RangeError('unknown argument')
  const options: Options = {
    dshSource: resolve(values.get('--dsh-source')!),
    dshHome: resolve(values.get('--dsh-home')!),
    profile: values.get('--profile')!,
    receipt: resolve(values.get('--receipt')!),
    tarball: resolve(values.get('--tarball')!),
    outputDirectory: resolve(values.get('--out-dir')!),
  }
  if (![options.dshSource, options.dshHome, options.receipt, options.tarball, options.outputDirectory].every(isAbsolute)) {
    throw new RangeError('all paths must be absolute')
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.profile)) {
    throw new RangeError('profile must use only letters, digits, dot, underscore, and hyphen')
  }
  if (process.platform === 'win32') {
    for (const path of [options.dshSource, options.dshHome, options.receipt, options.tarball, options.outputDirectory]) {
      if (parse(path).root.toUpperCase() !== 'D:\\') throw new RangeError('Stage 3 paths must remain on D:')
    }
  }
  return options
}

function yamlString(value: string): string {
  return `'${value.replaceAll('\\', '/').replaceAll("'", "''")}'`
}

async function assertFile(path: string, label: string): Promise<void> {
  const details = await stat(path)
  if (!details.isFile()) throw new Error(`${label} is not a file`)
}

async function createFreshDirectory(path: string): Promise<void> {
  try {
    await stat(path)
    throw new Error('Stage 3 output directory already exists')
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException | null)?.code !== 'ENOENT') throw cause
  }
  await mkdir(path, { recursive: true })
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

function childEnvironment(dshHome: string): NodeJS.ProcessEnv {
  const allowed = [
    'PATH',
    'Path',
    'PATHEXT',
    'SystemRoot',
    'WINDIR',
    'COMSPEC',
    'TEMP',
    'TMP',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'PROGRAMDATA',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'CommonProgramFiles',
  ]
  const env: NodeJS.ProcessEnv = {
    DSH_HOME: dshHome,
    DSH_PERMISSION_MODE: 'read-only',
    NO_COLOR: '1',
  }
  for (const name of allowed) {
    if (process.env[name] !== undefined) env[name] = process.env[name]
  }
  return env
}

function executeFile(
  file: string,
  args: readonly string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(file, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
      timeout: options.timeoutMs,
      windowsHide: true,
    }, (error, stdout, stderr) => {
      if (error !== null) {
        rejectPromise(new Error('bounded child command failed', { cause: error }))
        return
      }
      resolvePromise({ stdout, stderr })
    })
  })
}

async function gitRevision(repository: string): Promise<string> {
  const result = await executeFile('git', ['-c', `safe.directory=${repository.replaceAll('\\', '/')}`, '-C', repository, 'rev-parse', 'HEAD'], {
    cwd: repository,
    env: childEnvironment(process.env.DSH_HOME ?? repository),
    timeoutMs: 10_000,
  })
  if (result.stderr.trim() !== '') throw new Error('git revision wrote stderr')
  const revision = result.stdout.trim()
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error('git revision is invalid')
  return revision
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, path)
}

async function run(options: Options): Promise<void> {
  const profileRoot = join(options.dshHome, 'profiles', options.profile)
  const profileManifestPath = join(profileRoot, 'package.json')
  const installedPluginPath = join(profileRoot, 'node_modules', 'dsh-effect-doctor', 'dist', 'src', 'dsh-plugin.js')
  const appBootPath = join(options.dshSource, 'packages', 'boot', 'app-boot', 'lib', 'index.js')
  const toolsPath = join(options.dshSource, 'packages', 'core', 'tools', 'lib', 'index.js')
  const systemPromptPath = join(options.dshSource, 'packages', 'core', 'system-prompt', 'lib', 'index.js')
  const cordisRuntimePath = join(options.dshSource, 'vendor', 'cordis', 'lib', 'index.js')
  const dshCliPath = join(options.dshSource, 'apps', 'cli', 'src', 'bin.ts')

  for (const [path, label] of [
    [profileManifestPath, 'profile manifest'],
    [installedPluginPath, 'installed plugin'],
    [appBootPath, 'DSH app boot'],
    [toolsPath, 'DSH tools runtime'],
    [systemPromptPath, 'DSH system prompt'],
    [cordisRuntimePath, 'DSH Cordis runtime'],
    [dshCliPath, 'DSH source CLI'],
    [options.receipt, 'receipt'],
    [options.tarball, 'tarball'],
  ] as const) {
    await assertFile(path, label)
  }

  const profileManifest = JSON.parse(await readFile(profileManifestPath, 'utf8')) as ProfileManifest
  if (profileManifest.dependencies?.['dsh-effect-doctor'] === undefined) {
    throw new Error('profile does not depend on dsh-effect-doctor')
  }
  if (!profileManifest.dsh?.profile?.bundles?.includes('dsh-effect-doctor')) {
    throw new Error('profile does not activate dsh-effect-doctor bundle')
  }

  await createFreshDirectory(options.outputDirectory)

  const dump = await executeFile(process.execPath, [
    '--import',
    'tsx/esm',
    dshCliPath,
    '--profile',
    options.profile,
    '--dump-config',
  ], {
    cwd: options.dshSource,
    env: childEnvironment(options.dshHome),
    timeoutMs: 30_000,
  })
  if (dump.stderr.trim() !== '') throw new Error('DSH dump-config wrote stderr')
  if (!dump.stdout.includes('# == dsh-effect-doctor')
    || !dump.stdout.includes('name: dsh-effect-doctor/dsh-plugin')
    || !dump.stdout.includes("ctx.dshHomePath('effect-doctor/latest/receipt.json')")) {
    throw new Error('DSH dump-config does not contain the installed doctor layer')
  }

  const dumpConfigPath = join(options.outputDirectory, 'dump-config.txt')
  await writeFile(dumpConfigPath, dump.stdout, 'utf8')

  const loaderConfigPath = join(options.outputDirectory, 'loader.cordis.yml')
  const loaderConfig = [
    '- id: system-prompt',
    `  name: ${yamlString(pathToFileURL(systemPromptPath).href)}`,
    '- id: tools',
    `  name: ${yamlString(pathToFileURL(toolsPath).href)}`,
    '- id: effect-doctor',
    `  name: ${yamlString(pathToFileURL(installedPluginPath).href)}`,
    '  config:',
    `    receiptPath: ${yamlString(options.receipt)}`,
    '    maxBytes: 1048576',
    '    timeoutMs: 5000',
    '',
  ].join('\n')
  await writeFile(loaderConfigPath, loaderConfig, 'utf8')

  process.env.DSH_HOME = options.dshHome
  const appBoot = await import(pathToFileURL(appBootPath).href) as AppBootModule
  const toolsModule = await import(pathToFileURL(toolsPath).href) as ToolsModule
  const expected = await readReceiptSummary(options.receipt, 1024 * 1024)

  let ctx: DshContextLike | undefined
  let toolRegistered = false
  let outputSchemaValid = false
  let receiptMatches = false
  let renderMatches = false
  let pluginDisposed = false
  let toolRemoved = false
  try {
    ctx = await appBoot.boot('dsh-effect-doctor-stage3', loaderConfigPath)
    const tools = ctx.get('tools') as ToolRuntimeLike | undefined
    if (tools === undefined) throw new Error('real ToolRuntime service is unavailable')
    const tool = tools.get(TOOL_NAME)
    if (tool === undefined) throw new Error('doctor tool is not registered')
    toolRegistered = true

    const value = await tool.execute({}, { signal: new AbortController().signal })
    outputSchemaValid = toolsModule.validateJsonSchemaValue(tool.output.schema, value, '').length === 0
    if (!outputSchemaValid) throw new Error('doctor tool output failed its registered schema')
    receiptMatches = JSON.stringify(value) === JSON.stringify(expected)
    if (!receiptMatches) throw new Error('doctor tool output does not match the completed receipt')
    const rendered = tool.output.render({}, value)
    renderMatches = rendered.length === 1
      && rendered[0]?.type === 'text'
      && rendered[0].text === renderReceiptSummary(expected)
    if (!renderMatches) throw new Error('doctor tool rendering does not match the canonical summary')

    const entry = ctx.loader.resolve('include:effect-doctor')
    const doctorFiber = entry.fiber
    if (doctorFiber === undefined || doctorFiber.uid === null) throw new Error('doctor Loader entry has no active fiber')
    await doctorFiber.dispose()
    pluginDisposed = doctorFiber.uid === null
    toolRemoved = tools.get(TOOL_NAME) === undefined
    if (!pluginDisposed || !toolRemoved) throw new Error('doctor disposal left a tool registration')
  } finally {
    await ctx?.fiber.dispose()
  }

  const productRoot = resolve(import.meta.dirname, '..')
  const summary = {
    schemaVersion: GATE_SCHEMA_VERSION,
    outcome: 'PASS',
    sourceCommit: await gitRevision(productRoot),
    dshCommit: await gitRevision(options.dshSource),
    profile: options.profile,
    artifact: {
      tarballSha256: await sha256(options.tarball),
      installedPluginSha256: await sha256(installedPluginPath),
      receiptSha256: await sha256(options.receipt),
      cordisRuntimeSha256: await sha256(cordisRuntimePath),
      dumpConfigSha256: await sha256(dumpConfigPath),
      loaderConfigSha256: await sha256(loaderConfigPath),
    },
    receipt: {
      schemaVersion: expected.schemaVersion,
      fixture: expected.target.fixture,
      outcome: expected.outcome,
      exitCode: expected.exitCode,
    },
    checks: {
      profileDependency: true,
      bundleActivated: true,
      dumpConfigMatched: true,
      loaderBooted: true,
      toolRegistered,
      outputSchemaValid,
      receiptMatches,
      renderMatches,
      pluginDisposed,
      toolRemoved,
      webSurface: false,
      screenshotsApplicable: false,
    },
    limitations: [
      'The DSH tool displays an already-completed receipt; it never runs an audit or unloads a live target plugin.',
      'No client bundle or browser surface exists, so screenshot, style, page-error, and request-error gates are inapplicable.',
    ],
  }
  const summaryPath = join(options.outputDirectory, 'gate-summary.json')
  await atomicJson(summaryPath, summary)
  process.stdout.write(`${JSON.stringify({ outcome: summary.outcome, summary: summaryPath })}\n`)
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  if (options === undefined) {
    process.stdout.write(help())
    return
  }
  await run(options)
}

function errorMessages(error: unknown, seen = new Set<unknown>()): string[] {
  if (seen.has(error) || seen.size >= 20) return []
  seen.add(error)
  if (!(error instanceof Error)) return [String(error)]
  const messages = [error.message]
  if (error instanceof AggregateError) {
    for (const nested of error.errors) messages.push(...errorMessages(nested, seen))
  }
  if (error.cause !== undefined) messages.push(...errorMessages(error.cause, seen))
  return messages
}

main().catch((error: unknown) => {
  const name = error instanceof Error && error.name.trim() !== '' ? error.name : 'UnknownError'
  const message = [...new Set(errorMessages(error).filter(Boolean))].join(' | ') || 'unknown failure'
  process.stderr.write(`dsh-effect-doctor Stage 3 gate failed: ${name}: ${message}\n`)
  process.exitCode = 1
})
