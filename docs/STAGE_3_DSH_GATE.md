# Stage 3 real DSH integration evidence

## Result

- Gate result: `PASS` for the installed host-only receipt tool.
- Release classification: `PASS_AFTER_CHANGES`.
- Product source commit: `004fe47cd343163e9e945b226966436fcb0bdd35`.
- DSH source commit: `47f943859bef60e4160492346772ded9b24f765a`.
- DSH profile: `effect-doctor-stage3-004fe47` under `artifacts/stage-3/004fe47/dsh-home` on `D:`.
- Machine summary: `artifacts/stage-3/004fe47/runtime-gate/gate-summary.json`.
- Machine summary SHA-256: `3ff74b1b5cb4d335d27f3f52234b5d2d60de158b72cf4258651f43d75e42f37c`.

## Build and installation

- A clean fixture receipt was regenerated from the committed source and DSH vendored Cordis `4.0.1`; it returned `PASS` / exit `0`.
- `npm pack --pack-destination artifacts/stage-3/004fe47 --json` produced a prebuilt 27-file tarball. It contained the bundle patch, README, package manifest, CLI/library output, the post-fix engine, and DSH plugin output; it contained no tests or generated evidence.
- `pnpm dsh plugin --profile effect-doctor-stage3-004fe47 add <tarball>` initialized a fresh profile and installed the package plus three published dependencies on its first attempt. No build-script allowance, Git-install fallback, source-link fallback, or active profile mutation was used.
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

After the Stage 3 run, `npm run verify` passed again: unit tests `17/17`, real Cordis tests `4/4`, seven isolated CLI receipts, both CLI help contracts, and `skipped: 0`. The exercise-timeout regression test proves the mounted fiber is still disposed before the primary `FAIL_TIMEOUT` result is returned.

## Artifact identities

| Artifact | SHA-256 |
|---|---|
| Tarball | `c31bbc33d9852f0202a7630fc7b26845b3fe056bae1ac13c7a2c2e15b24f1767` |
| Installed `dsh-plugin.js` | `034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0` |
| Clean JSON receipt | `d1824d2a59506cfa025d7606176447633de73f3bf44866c2e54e3d1ada2f6746` |
| DSH vendored Cordis module | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Dumped installed composition | `8a661796bdb78600a4c482cfb5d8a82a282ff77f8b2f8d39b1e4d054632c27a0` |
| Minimal Loader configuration | `fd0009d43c1607d04c413cae49465d146514d61391ed8bddae669c535ff85145` |

All six artifact hashes and every summary boolean were independently recomputed after the gate. The summary property-name audit found no API key, credential, secret, password, cookie, or authorization fields.

The earlier `artifacts/stage-3/cd0d0f7` sealed run remains preserved as historical pre-fix evidence. It is not the release artifact identity after the exercise-timeout cleanup change.

## Web and screenshot classification

This product has no client export, browser bundle, slot, style, or Web surface. Client asset HTTP, style-node disposal, browser console/page/request errors, fork UI geometry/navigation, screenshots, and GIFs are `NOT_APPLICABLE_NO_WEB_SURFACE`. No substitute or fabricated screenshot exists.

## Limits

- The DSH tool only displays an already-completed, strictly validated receipt. It never runs an audit, unloads a live target plugin, or reads session/model/tool history.
- This gate proves the installed host-only DSH integration and exact tool-registration disposal. Engine coverage remains limited to the Cordis-managed categories and versions declared in `README.md` and `docs/release-evidence.md`.
- Claude review and repository-age eligibility remain separate gates. This Stage 3 `PASS` does not authorize a PR.
