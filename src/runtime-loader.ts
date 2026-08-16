import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, parse, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { CordisContextLike } from './cordis-adapter.js'
import type { RuntimeIdentity } from './contracts.js'

interface RuntimeModule {
  Context: new () => CordisContextLike
}

interface PackageIdentity {
  name: string
  version: string
}

export interface LoadedRuntime {
  context: CordisContextLike
  identity: RuntimeIdentity
}

export class RuntimeLoadError extends Error {
  constructor(code: string) {
    super(code)
    this.name = 'RuntimeLoadError'
  }
}

function isPathSpecifier(specifier: string): boolean {
  return specifier.startsWith('file:')
    || specifier.startsWith('.')
    || isAbsolute(specifier)
}

async function findPackageIdentity(modulePath: string): Promise<PackageIdentity | undefined> {
  let directory = dirname(modulePath)
  const root = parse(directory).root
  while (true) {
    const candidate = join(directory, 'package.json')
    try {
      const parsed = JSON.parse(await readFile(candidate, 'utf8')) as Record<string, unknown>
      if (typeof parsed.name === 'string' && typeof parsed.version === 'string') {
        return { name: parsed.name, version: parsed.version }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    if (directory === root) return
    directory = dirname(directory)
  }
}

async function resolveModule(specifier: string): Promise<{ importTarget: string; modulePath: string }> {
  if (specifier.startsWith('file:')) {
    const modulePath = fileURLToPath(specifier)
    await access(modulePath)
    return { importTarget: specifier, modulePath }
  }
  if (isPathSpecifier(specifier)) {
    const modulePath = resolve(specifier)
    await access(modulePath)
    return { importTarget: pathToFileURL(modulePath).href, modulePath }
  }
  const require = createRequire(import.meta.url)
  const modulePath = require.resolve(specifier)
  return { importTarget: specifier, modulePath }
}

async function fileHash(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

export async function loadCordisRuntime(
  specifier: string,
  versionOverride?: string,
): Promise<LoadedRuntime> {
  const resolved = await resolveModule(specifier)
  const loaded = await import(resolved.importTarget) as Partial<RuntimeModule>
  if (typeof loaded.Context !== 'function') {
    throw new RuntimeLoadError('CORDIS_CONTEXT_EXPORT_MISSING')
  }
  const packageIdentity = await findPackageIdentity(resolved.modulePath)
  const identity: RuntimeIdentity = {
    packageName: packageIdentity?.name ?? specifier,
    packageVersion: versionOverride ?? packageIdentity?.version ?? 'unknown',
    modulePath: resolved.modulePath,
    sourceHash: await fileHash(resolved.modulePath),
  }
  return { context: new loaded.Context(), identity }
}
