# Stage 3 real DSH integration evidence

## Result

- Gate result: `PASS` for the installed host-only receipt tool.
- Release classification: `PASS_AFTER_CHANGES`.
- Product source commit: `b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`.
- DSH source commit: `47f943859bef60e4160492346772ded9b24f765a`.
- DSH profile: `effect-doctor-stage3-b638cdd` under `artifacts/stage-3/b638cdd/dsh-home` on `D:`.
- Machine summary: `artifacts/stage-3/b638cdd/runtime-gate/gate-summary.json`.
- Machine summary SHA-256: `42236dd8889feda51938a6f8a7846dab3ff1f36dd83b05f3603a5d6b1e448e63`.

## Build and installation

- A clean fixture receipt was regenerated from the committed source and DSH vendored Cordis `4.0.1`; it returned `PASS` / exit `0`.
- `npm pack --pack-destination artifacts/stage-3/b638cdd --json` produced a prebuilt 27-file tarball. It contained the bundle patch, README, package manifest, CLI/library output, the final cleanup-precedence engine, and DSH plugin output; it contained no tests or generated evidence.
- `pnpm dsh plugin --profile effect-doctor-stage3-b638cdd add <tarball>` initialized a fresh profile and installed the package plus three published dependencies on its first attempt. No build-script allowance, Git-install fallback, source-link fallback, or active profile mutation was used.
- The committed Stage 3 gate invoked the real DSH source CLI to dump the installed profile composition. It found the `# == dsh-effect-doctor` layer, `dsh-effect-doctor/dsh-plugin`, and the configured `$DSH_HOME/effect-doctor/latest/receipt.json` path.

## Runtime checks

The gate booted a minimal real DSH configuration through `@deepseek-ai/dsh-app-boot` and Loader using the installed plugin artifact, the real DSH SystemPrompt service, and the real DSH ToolRuntime.

| Check | Result |
|---|---|
| Profile dependency present | `PASS` |
| Bundle activated | `PASS` |
| Dumped composition matched | `PASS` |
| Real Loader boot | `PASS` |
| `effect_doctor_receipt` registered | `PASS` |
| Tool output was JSON-safe under the registered `{}` schema | `PASS` |
| Tool output matched a separately read summary from the same strict parser implementation | `PASS` |
| Text rendering matched canonical summary | `PASS` |
| Only doctor Loader fiber disposed | `PASS` |
| Tool registration absent after disposal | `PASS` |
| Existing evidence directory rejected | `PASS` / exit `1` |

After the Stage 3 run, `npm run verify` passed again: unit tests `17/17`, real Cordis tests `4/4`, seven isolated CLI receipts, both CLI help contracts, and `skipped: 0`. The exercise-timeout regression test proves the mounted fiber is still disposed before the primary `FAIL_TIMEOUT` result is returned.

The gate resolves the definition from the real `ToolRuntime` and invokes that definition's `execute` function directly. It does not exercise the model-facing ToolRuntime dispatch pipeline. The substantive summary-shape proof is exact equality with a separately read result from the same strict parser implementation; the registered `{}` schema proves JSON-safety only.

## Artifact identities

| Artifact | SHA-256 |
|---|---|
| Tarball | `e2380f24d56f5071bc47b1cb7a382bb0abe2ad3dfcb40c8682983a41d974f72b` |
| Installed `dsh-plugin.js` | `034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0` |
| Clean JSON receipt | `d1824d2a59506cfa025d7606176447633de73f3bf44866c2e54e3d1ada2f6746` |
| DSH vendored Cordis module | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Dumped installed composition | `8a661796bdb78600a4c482cfb5d8a82a282ff77f8b2f8d39b1e4d054632c27a0` |
| Post-disposal Loader write-back configuration | `5dbdfb194e503ebe483f26ad4371c532db12a82cfdc5729ee769ecc93ff3de8a` |

All six artifact hashes and every summary boolean were independently recomputed after the gate. The summary property-name audit found no API key, credential, secret, password, cookie, or authorization fields.

The Loader configuration hash is computed from the preserved post-run file after entry disposal wrote back `disabled: true`; it is not the hash of the gate's initially authored input bytes.

The earlier `artifacts/stage-3/cd0d0f7` and `artifacts/stage-3/004fe47` sealed runs remain preserved as historical evidence. Neither is the final release artifact identity after the exercise-timeout cleanup and cleanup-error precedence changes.

## Web and screenshot classification

This product has no DSH client export, browser bundle, slot, client style registration, or Web surface. The standalone CLI can emit an unserved static `receipt.html` with inline presentation CSS; that is not a DSH client surface. Client asset HTTP, style-node disposal, browser console/page/request errors, fork UI geometry/navigation, screenshots, and GIFs are `NOT_APPLICABLE_NO_WEB_SURFACE`. No substitute or fabricated screenshot exists.

## Limits

- The DSH tool only displays an already-completed, strictly validated receipt. It never runs an audit, unloads a live target plugin, or reads session/model/tool history.
- The Stage 3 gate validates the resolved tool definition directly, not the full model-facing ToolRuntime dispatch pipeline; it uses the same strict parser implementation in a separate source copy rather than an independent parser implementation.
- This gate proves the installed host-only DSH integration and exact tool-registration disposal. Engine coverage remains limited to the Cordis-managed categories and versions declared in `README.md` and `docs/release-evidence.md`.
- Claude R3 engine, R4A viewer, R4B Stage 3, and R5 aggregate-final reviews are validated `GO`; repository-age, target-list rules, and focused PR diff remain separate gates. This Stage 3 `PASS` and Claude technical `GO` do not authorize a PR.
