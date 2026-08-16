# dsh-effect-doctor

`dsh-effect-doctor` verifies one narrow lifecycle property: after a fixture is mounted, exercised, unmounted, and allowed to settle, the Cordis-managed resources visible through the supported adapter return to their baseline.

The project is a technical preview. Its verified release classification is `PASS_AFTER_CHANGES`, not `FIRST_PASS`.

## What it proves

The current adapter is pinned to DeepSeek Harness's vendored `@deepseek-ai/cordis@4.0.1`. It observes:

- plugin fibers and lifecycle state;
- registry runtimes;
- Cordis-managed effects and disposables;
- Cordis event registrations;
- Cordis services/providers visible through the adapter;
- timer effects registered through Cordis when the timer plugin is present.

The adapter checks every private observation surface before use. An unsupported version or changed runtime structure produces `UNVERIFIABLE_VERSION` or `UNVERIFIABLE_SURFACE`; it never silently becomes `PASS`.

## What it does not prove

This is not a general memory-leak detector. It does not claim coverage for bare JavaScript timers, DOM or global listeners, native handles, external processes, arbitrary heap growth, or resources that bypass Cordis. It is not a security audit or production approval.

The audit runner does not inspect prompts, session bodies, tool arguments/results, credentials, cookies, or plugin business data. Receipts contain only runtime identity, lifecycle configuration, stable resource metadata, bounded error names/codes, the comparison, and stated limitations.

## CLI

Install dependencies and build without running dependency scripts:

```powershell
npm ci --ignore-scripts
npm run build
```

Run a fixture against the DSH vendored Cordis module:

```powershell
node dist/src/cli.js `
  --fixture clean `
  --cordis-module D:\knowledgeBase\deepseek-harness\vendor\cordis\lib\index.js `
  --out-dir artifacts\latest
```

The output directory receives deterministic `receipt.json`, `receipt.md`, and self-contained `receipt.html` files. The CLI uses a single-run lock and bounded mount, exercise, unmount, and settle phases.

Supported fixtures are `clean`, `leaky`, `throwing-disposer`, `hanging-disposer`, `startup-failure`, and `unknown-version`. Run `node dist/src/cli.js --help` for timing and lock options.

## Outcomes

| Outcome | Exit | Meaning |
|---|---:|---|
| `PASS` | 0 | Declared Cordis-managed resources returned to baseline. |
| `FAIL_LEAK` | 20 | A declared resource remained after settle. |
| `FAIL_DISPOSE` | 21 | Cordis logged a disposer failure. |
| `FAIL_TIMEOUT` | 22 | A bounded lifecycle or settle phase timed out. |
| `FAIL_MOUNT` | 23 | Fixture startup failed. |
| `FAIL_EXERCISE` | 24 | The explicit exercise callback failed. |
| `FAIL_LOCKED` | 25 | Another audit owns the single-run lock. |
| `UNVERIFIABLE_VERSION` | 30 | The Cordis package/version is unsupported. |
| `UNVERIFIABLE_SURFACE` | 31 | A required observation surface failed validation. |

Every non-`PASS` result exits non-zero. Red lines use explicit checks, not `assert`.

## DSH receipt tool

The package also contains a host-only DSH bundle. It registers one generic tool, `effect_doctor_receipt`, which reads an already-completed receipt from the configured absolute path and returns a strict, sanitized summary.

The tool does not start an audit, unload a live plugin, accept a caller-controlled path, or read session content. It enforces a configurable byte limit, rejects unknown JSON fields, omits the receipt's host module path, and uses DSH's effect-owned tool registration so unloading the bundle removes the tool.

The bundle defaults to:

```text
$DSH_HOME/effect-doctor/latest/receipt.json
```

Generate that file by setting the CLI output directory to `$DSH_HOME/effect-doctor/latest`. The bundle configuration can override `receiptPath`, `maxBytes`, and `timeoutMs` in a later DSH patch layer.

This package has no client bundle or browser surface. Browser screenshots, GIFs, client assets, style nodes, and page-console checks are therefore inapplicable and must not be substituted or fabricated.

## Local bundle install

Build a precompiled tarball, then install it into an isolated profile from the DeepSeek Harness checkout:

```powershell
npm pack --pack-destination artifacts\stage-3

$env:DSH_HOME = 'D:\dsh-effect-doctor-gate'
Set-Location D:\knowledgeBase\deepseek-harness
pnpm dsh plugin --profile effect-doctor-stage3 add D:\knowledgeBase\dsh-effect-doctor\artifacts\stage-3\dsh-effect-doctor-0.1.0.tgz
pnpm dsh --profile effect-doctor-stage3 --dump-config
```

The tarball is prebuilt; installation does not need a package build-script allowance. Use a fresh D-drive `DSH_HOME` for audit evidence and never install or unload fixtures in an active production profile.

After installation, run the keyless real Loader gate against the installed module:

```powershell
node dist/scripts/dsh-real-gate.js `
  --dsh-source D:\knowledgeBase\deepseek-harness `
  --dsh-home D:\dsh-effect-doctor-gate `
  --profile effect-doctor-stage3 `
  --receipt D:\dsh-effect-doctor-gate\effect-doctor\latest\receipt.json `
  --tarball D:\path\to\dsh-effect-doctor-0.1.0.tgz `
  --out-dir D:\path\to\stage-3-evidence
```

This gate rechecks the installed profile and dumped composition, boots a minimal real DSH Loader tree, executes the registered tool, validates its output against the completed receipt, disposes only the doctor Loader entry, and proves the tool registration disappears.

## Verification

```powershell
npm run verify
```

The command runs strict typechecking, a production build, unit contracts, the CLI contract, tests against the real DSH vendored Cordis runtime, and the isolated child-process gate. Stage evidence and artifact identities are recorded in `docs/`.

Publication remains fail-closed. No PR may be created until the GitHub repository is at least 24 hours old, the product has at least 10 genuine functional commits, Stage 0–3 evidence is complete, any applicable real screenshots exist, and Claude's independent read-only review ends with `FINAL_DECISION: GO`.
