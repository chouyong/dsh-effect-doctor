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
- No Claude request, GitHub write, PR, cleanup, reset, or cross-repository modification performed.
