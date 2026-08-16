# dsh-effect-doctor release evidence preregistration

This preregistration is the Stage 0 contract. It records expected machine outcomes before implementation and keeps the DSH release gate fail-closed.

## Identity

- Repository: `dsh-effect-doctor`; workspace: `D:\knowledgeBase\dsh-effect-doctor`.
- Product Git repository: local `main` initialized; public remote `https://github.com/chouyong/dsh-effect-doctor` created at `2026-08-16T11:35:15Z`; no product commit or artifact existed at creation time.
- Source facts: primary DSH runtime `@deepseek-ai/cordis` `4.0.1`; upstream comparison Cordis core `4.0.0-rc.8`; upstream timer plugin `1.1.2`; DeepSeek Harness source `0.1.0-rc.5`.
- Requested storage: product source, temporary profiles, runner spill files, receipts, and artifacts stay on `D:`; no secrets are persisted.
- DSH runtime: not started for Stage 0; no live web port, relay URL, or active profile is assumed.

## Stage 0 support and observation contract

- Supported adapter baseline: DSH vendored `@deepseek-ai/cordis` `4.0.1`, with runtime shape checks for `Context.registry.plugin`, `RegistryService.get/has/size/entries`, `Fiber.uid/state/dispose/getEffects`, reflect provider records, logger cursor/buffer, internal event-hook projection, and pinned `FiberState` values.
- Public lifecycle: `ctx.registry.plugin(fixture)` → await returned fiber → `fiber.dispose()` → await settle window → snapshot/compare.
- Adapter-only surfaces: `Fiber._hooks`, `Fiber._disposables`, `EventsService._hooks`, and Node internal loader APIs. Missing fields, unexpected types, version mismatch, or private-surface drift produce `UNVERIFIABLE_VERSION` or `UNVERIFIABLE_SURFACE` with non-zero exit.
- Covered resources: Cordis fibers/states, registry runtimes, Cordis-managed effects/disposables, Cordis event registrations, services/providers visible through the adapter, and Cordis timer effects when the timer plugin is installed.
- Not covered: arbitrary `setTimeout`, DOM/global listeners, native handles, external processes, memory usage, session contents, prompts, tool arguments/results, credentials, cookies, or business data.

## Fixture expectations

| Fixture | Expected lifecycle result | Exit |
|---|---|---:|
| clean disposer | `PASS` | 0 |
| declared Cordis effect intentionally retained | `FAIL_LEAK` | non-zero |
| disposer throws | `FAIL_DISPOSE` | non-zero |
| settle deadline exceeded | `FAIL_TIMEOUT` | non-zero |
| unsupported Cordis version/shape | `UNVERIFIABLE_VERSION` or `UNVERIFIABLE_SURFACE` | non-zero |

## Isolation and evidence

- Runner uses a fresh D-drive temporary directory/context and a single-run lock; it never disables or unloads a third-party plugin in a user's active profile.
- Receipts use a versioned JSON schema and a deterministic comparison section; timestamps and random IDs are isolated from equality checks. Markdown/HTML summaries contain only the allowed resource metadata and error summaries.
- There is no web surface at Stage 0. Browser screenshots and GIFs are therefore not fabricated; a read-only viewer is considered only after the engine passes isolated evidence.

## Publication gate

- Status: `WAITING_ELIGIBILITY`.
- A PR is forbidden until all are independently proven: GitHub repository age ≥24 hours, ≥10 real functional product commits, Stage 0 `GO_ENGINE`, Stage 1–3 evidence, genuine screenshots if a web surface exists, and Claude's fail-closed technical review `FINAL_DECISION: GO`.
- GitHub owner/visibility are `chouyong` / `public`. Earliest repository-age eligibility is `2026-08-17T11:35:15Z`; this timestamp alone does not authorize a PR.

## Outcome

- Stage 0: `GO_ENGINE`.
- Stage 1: typecheck, build, CLI contract, unit tests, and real Cordis tests pass with zero skips.
- Stage 2: isolated child-process gate passes all seven preregistered receipts at post-fix source commit `004fe47cd343163e9e945b226966436fcb0bdd35`; exact hashes are in `docs/STAGE_2_ISOLATED_GATE.md`.
- Stage 3: prebuilt bundle installation, real DSH composition, real Loader registration/execution, receipt consistency, and precise doctor disposal pass at post-fix source commit `004fe47cd343163e9e945b226966436fcb0bdd35`; exact hashes are in `docs/STAGE_3_DSH_GATE.md`.
- Release classification: `PASS_AFTER_CHANGES`; post-fix Claude review, Claude final `GO`, and repository-age eligibility remain open.
