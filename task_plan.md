# dsh-effect-doctor execution plan

## Goal

Complete Stage 0 technical validation and, if the observable Cordis surfaces are reliable, implement and verify the isolated cleanup doctor without overstating coverage. Keep PR publication fail-closed until repository age is at least 24 hours, there are at least 10 real functional commits, and Claude's independent review is `GO`.

## Phases

- [complete] Stage 0: preregister evidence and prove `GO_ENGINE` or close `NO_GO_UNRELIABLE_SURFACE`
- [complete] Stage 1: scaffold engine, adapter, schema, fixtures, and verification commands
- [complete] Stage 2: run isolated runner and capture machine-readable receipts
- [in_progress] Stage 3: add optional read-only DSH surface and real runtime evidence
- [pending] Stage 4: stabilize evidence, run Claude review, and prepare only eligible publication artifacts

## Current gates

- PR publication: `WAITING_ELIGIBILITY` until GitHub creation age, 10 real commits, and Claude `GO` are all proven.
- Claude review: not started; prohibited until implementation and evidence are stable.
- GitHub repository: created with explicit authorization as public `chouyong/dsh-effect-doctor`; PR publication remains fail-closed.

## Errors Encountered

| Error | Attempt | Resolution |
|---|---:|---|
| Product directory is not a Git repository | 1 | Preserve files; initialize local `main` only after Stage 0 evidence plan is recorded. |
| Initial `gh repo view chouyong/dsh-effect-doctor` returned repository not found | 1 | Confirmed the remote did not exist; asked for visibility, then created it after explicit Public authorization. |
| `git diff --cached --check` found blank lines at EOF in two documents | 1 | Removed only the extra terminal blank lines with `apply_patch`; rerun the cached diff check before commit. |
| Scaffold cached diff check found blank lines at EOF in five new files | 1 | Removed only the terminal blank lines; rerun the cached diff check without repeating the failed aggregate. |
| Post-commit graphify hook warned about an ignored null byte | 1 | Applied Windows release evidence triage; commit/push were successful and the hook's background rebuild also completed. |
| One parallel local Git observer reported dubious ownership | 1 | Used command-scoped `-c safe.directory=...` for read-only object/ref verification; did not change global config. |
| First real adapter probe rejected Cordis's callable logger service | 1 | Expanded the structural predicate to accept non-null objects and functions; rerun build and the real adapter probe. |
| First engine typecheck could not resolve Node globals/modules | 1 | Added the already-installed `@types/node` to `compilerOptions.types`; rerun typecheck before behavior tests. |
| Fixture thenable type recursively fulfilled with itself | 1 | Narrowed the fixture-only await contract to `PromiseLike<void>`; production adapter retains the real Fiber type. |
