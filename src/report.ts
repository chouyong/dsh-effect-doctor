import { mkdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AuditReceipt, ResourceRecord } from './contracts.js'

function markdownEscape(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function htmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function resourceRows(resources: ResourceRecord[]): string {
  if (resources.length === 0) return '_None._'
  return [
    '| Category | Identity | Label | Owner | State |',
    '|---|---|---|---|---|',
    ...resources.map(resource => {
      return `| ${markdownEscape(resource.category)} | ${markdownEscape(resource.identity)} | ${markdownEscape(resource.label)} | ${markdownEscape(resource.owner)} | ${markdownEscape(resource.state ?? '')} |`
    }),
  ].join('\n')
}

export function serializeReceipt(receipt: AuditReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`
}

export function renderMarkdown(receipt: AuditReceipt): string {
  return [
    '# dsh-effect-doctor receipt',
    '',
    `- Outcome: \`${receipt.outcome}\``,
    `- Exit code: \`${receipt.exitCode}\``,
    `- Schema: \`${receipt.schemaVersion}\``,
    `- Runtime: \`${receipt.runtime.packageName}@${receipt.runtime.packageVersion}\``,
    `- Runtime module: \`${receipt.runtime.modulePath}\``,
    `- Fixture: \`${receipt.target.fixture}\``,
    `- Added resources: \`${receipt.delta.added.length}\``,
    `- Removed resources: \`${receipt.delta.removed.length}\``,
    `- Recorded errors: \`${receipt.errors.length}\``,
    '',
    '## Added resources',
    '',
    resourceRows(receipt.delta.added),
    '',
    '## Removed resources',
    '',
    resourceRows(receipt.delta.removed),
    '',
    '## Limitations',
    '',
    ...receipt.limitations.map(item => `- ${item}`),
    '',
  ].join('\n')
}

export function renderHtml(receipt: AuditReceipt): string {
  const json = htmlEscape(serializeReceipt(receipt))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-effect-doctor ${htmlEscape(receipt.outcome)}</title>
<style>
body{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;margin:2rem;background:#0b1020;color:#dbeafe}main{max-width:72rem;margin:auto}h1{font-size:1.5rem}.outcome{display:inline-block;padding:.35rem .65rem;border:1px solid #60a5fa;border-radius:.4rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#111827;padding:1rem;border-radius:.5rem;border:1px solid #334155}
</style>
</head>
<body>
<main>
<h1>dsh-effect-doctor receipt</h1>
<p class="outcome">${htmlEscape(receipt.outcome)} / exit ${receipt.exitCode}</p>
<p>Runtime: ${htmlEscape(`${receipt.runtime.packageName}@${receipt.runtime.packageVersion}`)}</p>
<p>Fixture: ${htmlEscape(receipt.target.fixture)}</p>
<pre>${json}</pre>
</main>
</body>
</html>
`
}

async function atomicWrite(path: string, content: string): Promise<void> {
  const temporary = `${path}.${process.pid}.tmp`
  await writeFile(temporary, content, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, path)
}

export async function writeReceiptFiles(
  outputDirectory: string,
  receipt: AuditReceipt,
): Promise<void> {
  await mkdir(outputDirectory, { recursive: true })
  await Promise.all([
    atomicWrite(join(outputDirectory, 'receipt.json'), serializeReceipt(receipt)),
    atomicWrite(join(outputDirectory, 'receipt.md'), renderMarkdown(receipt)),
    atomicWrite(join(outputDirectory, 'receipt.html'), renderHtml(receipt)),
  ])
}
