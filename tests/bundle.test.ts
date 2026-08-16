import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'

interface PackageManifest {
  exports?: Record<string, unknown>
  files?: string[]
  dsh?: {
    bundle?: {
      patch?: string
    }
  }
}

test('package exposes a prebuilt host-only DSH bundle', async () => {
  const manifest = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8')) as PackageManifest
  const patch = await readFile(join(process.cwd(), 'cordis.patch.yml'), 'utf8')

  assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.ok(manifest.exports?.['./dsh-plugin'])
  assert.ok(manifest.files?.includes('cordis.patch.yml'))
  assert.match(patch, /name: dsh-effect-doctor\/dsh-plugin/)
  assert.match(patch, /effect-doctor\/latest\/receipt\.json/)
  assert.doesNotMatch(patch, /client|session|prompt/i)
  await stat(join(process.cwd(), 'dist', 'src', 'dsh-plugin.js'))
})
