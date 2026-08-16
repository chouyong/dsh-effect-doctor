# Stage 3 real DSH integration evidence

## Result

- Gate result: `PASS` for the installed host-only receipt tool.
- Release classification: `PASS_AFTER_CHANGES`.
- Product source commit: `cd0d0f7990ef5f6c8b65cc78b74af13ff39971a8`.
- DSH source commit: `47f943859bef60e4160492346772ded9b24f765a`.
- DSH profile: `effect-doctor-stage3-cd0d0f7` under `artifacts/stage-3/cd0d0f7/dsh-home` on `D:`.
- Machine summary: `artifacts/stage-3/cd0d0f7/runtime-gate/gate-summary.json`.
- Machine summary SHA-256: `a6ab72e3bab944af4d4a3bda2c8d553955ba67b912c561c4ab0b1b22f2c02d1b`.

## Build and installation

- A clean fixture receipt was regenerated from the committed source and DSH vendored Cordis `4.0.1`; it returned `PASS` / exit `0`.
- `npm pack --pack-destination artifacts/stage-3/cd0d0f7 --json` produced a prebuilt 27-file tarball. It contained the bundle patch, README, package manifest, CLI/library output, and DSH plugin output; it contained no tests or generated evidence.
- `pnpm dsh plugin --profile effect-doctor-stage3-cd0d0f7 add <tarball>` initialized a fresh profile and installed the package plus three published dependencies on its first attempt. No build-script allowance, Git-install fallback, source-link fallback, or active profile mutation was used.
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
| Tool output satisfied registered JSON Schema | `PASS` |
| Tool output matched independently parsed receipt | `PASS` |
| Text rendering matched canonical summary | `PASS` |
| Only doctor Loader fiber disposed | `PASS` |
| Tool registration absent after disposal | `PASS` |
| Existing evidence directory rejected | `PASS` / exit `1` |

After the Stage 3 run, `npm run verify` passed again: unit tests `16/16`, real Cordis tests `4/4`, seven isolated CLI receipts, both CLI help contracts, and `skipped: 0`.

## Artifact identities

| Artifact | SHA-256 |
|---|---|
| Tarball | `dd9efec8af86456699a6ab9019c7062e4a4ad3a5fd37246b73231af9b408a85a` |
| Installed `dsh-plugin.js` | `034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0` |
| Clean JSON receipt | `d1824d2a59506cfa025d7606176447633de73f3bf44866c2e54e3d1ada2f6746` |
| DSH vendored Cordis module | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Dumped installed composition | `8a661796bdb78600a4c482cfb5d8a82a282ff77f8b2f8d39b1e4d054632c27a0` |
| Minimal Loader configuration | `eb0e1fceef245f2d0047fa1a223186e8d3233f974211ebcdd0e0a7022ef7a31b` |

All six artifact hashes and every summary boolean were independently recomputed after the gate. The summary property-name audit found no API key, credential, secret, password, cookie, or authorization fields.

## Web and screenshot classification

This product has no client export, browser bundle, slot, style, or Web surface. Client asset HTTP, style-node disposal, browser console/page/request errors, fork UI geometry/navigation, screenshots, and GIFs are `NOT_APPLICABLE_NO_WEB_SURFACE`. No substitute or fabricated screenshot exists.

## Limits

- The DSH tool only displays an already-completed, strictly validated receipt. It never runs an audit, unloads a live target plugin, or reads session/model/tool history.
- This gate proves the installed host-only DSH integration and exact tool-registration disposal. Engine coverage remains limited to the Cordis-managed categories and versions declared in `README.md` and `docs/release-evidence.md`.
- Claude review and repository-age eligibility remain separate gates. This Stage 3 `PASS` does not authorize a PR.
