# Progress log

## 2026-08-16

- Read `docs/CODEX_START_PROMPT.md` completely.
- Read and selected `planning-with-files`, `dsh-plugin-real-release-gate`, and `codex-claude-cli-review` skills.
- Confirmed the product directory has no Git repository, no `.codegraph`, and no local `AGENTS.md`/`CLAUDE.md`.
- Confirmed source repositories `cordis` and `deepseek-harness` have initialized CodeGraph indexes.
- Queried both CodeGraph indexes; recorded initial lifecycle/profile evidence in `findings.md`.
- Completed exact Cordis lifecycle/source inspection and recorded the Stage 0 decision as `GO_ENGINE`; preregistered the gate in `docs/release-evidence.md`.
- Initialized local Git `main`, created public GitHub repository `chouyong/dsh-effect-doctor`, bound `origin`, and recorded the real API creation timestamp in `docs/publication-eligibility.md`.
- The first same-name repository lookup returned the expected not-found error; no write occurred until the user selected Public visibility.
- Root hook projection created `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`, `.meta-kim/`, and `graphify-out/`; these remain preserved and unstaged. Read both root rule files before continuing.
- Pushed the first real milestone commit `1f3b0ba` to `origin/main`.
- Rebased the adapter target from upstream Cordis comparison source to the actual DSH vendored `@deepseek-ai/cordis` `4.0.1` runtime after inspecting its built package and lifecycle implementation.
- Ran a real vendored-Cordis import probe: clean mount/dispose returned registry size to zero, target uid to `null`, state to `DISPOSED`, and root effects to empty.
- Began Stage 1 with the package/TypeScript scaffold and versioned receipt/outcome/adapter contracts.
- Installed three development packages with `npm install --ignore-scripts --legacy-peer-deps`; initial `npm run typecheck` passed.
- Classified the post-commit graphify null-byte warning as `secondary_warning`: local commit object, exact 11-file set, local refs, remote API SHA, and pushed remote files all resolve to `e49490b`; the background graph rebuild completed successfully.
- One read-only Git observer ran under a different ownership context and rejected the repository as dubious; a command-scoped `safe.directory` check completed without changing global Git config.
- Initialized this developing repository with `codegraph init -i`; the initial index contains the two current TypeScript source files.
- First real adapter probe correctly mounted and returned clean resources to baseline, but exposed a shape-check bug: Cordis logger is callable. Recorded the failure before patching the predicate.
- Corrected callable-service probing. Typecheck, build, and the expanded real adapter probe pass: baseline `3`, mounted `13`, after `3`, with effect/fiber/listener/runtime/service categories all observed.
- Added the pure engine, deterministic comparison, bounded phases, and single-run lock. The first typecheck found only missing Node type activation in `tsconfig` and is being corrected.
- Engine validation now passes against real vendored Cordis: clean => `PASS`; retained root sibling => `FAIL_LEAK`; logged throwing disposer => `FAIL_DISPOSE`; hanging disposer => `FAIL_TIMEOUT`; version `0.0.0` => `UNVERIFIABLE_VERSION`.
- Added the fixture set; its first typecheck exposed a fixture-only recursive thenable declaration, now narrowed to the only behavior fixtures need: awaitable completion.
- All six fixtures pass real vendored-Cordis outcome checks: clean `PASS`, leaky `FAIL_LEAK`, throwing `FAIL_DISPOSE`, hanging `FAIL_TIMEOUT`, startup `FAIL_MOUNT`, unknown `UNVERIFIABLE_VERSION`.
- Added the CLI, runtime package/version/hash loader, atomic JSON/Markdown/HTML receipt writers, and package bin contract.
- Real CLI checks pass with exit `0/20/30` for clean/leaky/unknown; two independent clean JSON receipts have identical SHA-256 `2E7FB141CC24C7180CF4972A486EF0EC0DFA0C2C034F62DAB3C19E1240587D9A`.
- Added formal contract/engine tests and real vendored-Cordis tests. `npm run verify` passes with unit `9/9`, real `4/4`, and `skipped: 0` in both suites.
- Added the Stage 2 isolated real-gate runner with scrubbed child environments, exact child ownership, bounded parent timeout, exit/receipt/hash validation, and deterministic summary output. Typecheck passes; runtime evidence will be generated after committing the runner so its source SHA is exact.
- Full `npm run verify` passed at `0b1e7c0`; Stage 2 generated seven validated receipts and `gate-summary.json`. Independent hash and privacy checks passed, and `docs/STAGE_2_ISOLATED_GATE.md` records the stable evidence.
- No Claude request, GitHub write, PR, cleanup, reset, or cross-repository modification performed.
- Resumed Stage 3 from `d45b7a3`; confirmed 9 real commits, clean tracked state, and only preserved rule projections untracked.
- Proved the real DSH tool/Loader lifecycle: registration is effect-owned, the installed entry is individually resolvable/disposable, and keyless `app-boot.boot()` can execute a real Loader composition.
- `@deepseek-ai/dsh-tools@0.1.0-rc.5` is not on npm, while Cordis `4.0.1` and Schemastery `3.18.1` are published. Added exact Schemastery with scripts disabled for bundle config validation.
- Added the strict bounded receipt reader, sanitized summary projector, host-only DSH tool plugin, Schemastery config, and bundle patch. The first `npm run typecheck`, build, and expanded unit suite passed: `15/15`, failed `0`, skipped `0`.
- Added the README support matrix, no-Web evidence rule, bundle installation guide, and package-content contract. `npm pack --dry-run --json` reported 27 intended files, 17,296 packed bytes, and no tests or artifacts.
- The full pre-commit `npm run verify` passed with unit `16/16`, real Cordis `4/4`, seven isolated receipts, and `skipped: 0`. The Stage 2 gate correctly remained bound to committed source `d45b7a3` while Stage 3 changes were uncommitted.
