# dsh-effect-doctor execution plan

## Goal

Complete Stage 0 technical validation and, if the observable Cordis surfaces are reliable, implement and verify the isolated cleanup doctor without overstating coverage. Keep PR publication fail-closed until repository age is at least 24 hours, there are at least 10 real functional commits, and Claude's independent review is `GO`.

## Phases

- [complete] Stage 0: preregister evidence and prove `GO_ENGINE` or close `NO_GO_UNRELIABLE_SURFACE`
- [complete] Stage 1: scaffold engine, adapter, schema, fixtures, and verification commands
- [complete] Stage 2: run isolated runner and capture machine-readable receipts
- [complete] Stage 3: add optional read-only DSH surface and real runtime evidence
- [in_progress] Stage 4: stabilize evidence, run Claude review, and prepare only eligible publication artifacts

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
| Combined Stage 3 preflight read failed because `README.md` does not exist | 1 | Record the missing required deliverable; rerun only the remaining independent reads with settled results and create README during Stage 3. |
| DSH schema probe imported unpublished `packages/core/tools/lib/schema.js` | 1 | Use the package's public `lib/index.js` export surface or source evidence; do not repeat the internal build-path assumption. |
| Schemastery probe assumed nonexistent vendored `lib/index.js` | 1 | Install the published pinned package into the product and verify its public export/API through the project's own resolver. |
| Stage 3 aggregate patch did not match npm-reordered `package.json` | 1 | No partial edit occurred; split source/tests from the manifest update and patch against the current package file. |
| First Stage 3 Loader gate returned only generic `Error` | 1 | No summary was written and the installed profile was unchanged; expose the gate's own sanitized error message, then rerun to a new output directory. |
| Stage 3 gate child launch returned sandbox `spawn EPERM` | 1 | Reran the exact gate with narrow host approval; the child launched and exposed a separate real Loader failure. |
| Minimal DSH Loader tree failed with only outer `AggregateError` | 1 | `app-boot` rolled back the root context; add bounded nested cause/error reporting to identify the exact failing entry before changing configuration. |
| Node 25 rejected Windows drive paths as Loader ESM specifiers | 1 | Convert only the three module names to canonical `file:///` URLs; keep `receiptPath` as a filesystem path and rerun with a new evidence directory. |
| Real Loader boot reached execution but `resolve('effect-doctor')` missed the nested entry | 1 | CodeGraph proved app boot pins a root `include` entry; resolve the public nested id `include:effect-doctor` and rerun in a new directory. |
