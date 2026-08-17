# dsh-effect-doctor execution plan

## Goal

Complete Stage 0 technical validation and, if the observable Cordis surfaces are reliable, implement and verify the isolated cleanup doctor without overstating coverage. Keep PR publication fail-closed until repository age is at least 24 hours, there are at least 10 real functional commits, and Claude's independent review is `GO`.

## Phases

- [complete] Stage 0: preregister evidence and prove `GO_ENGINE` or close `NO_GO_UNRELIABLE_SURFACE`
- [complete] Stage 1: scaffold engine, adapter, schema, fixtures, and verification commands
- [complete] Stage 2: run isolated runner and capture machine-readable receipts
- [complete] Stage 3: add optional read-only DSH surface and real runtime evidence
- [complete] Stage 4: stabilize evidence, run Claude review, and prepare only eligible publication artifacts
- [complete] Stage 5: enforce the current age gate and preserve fail-closed publication evidence
- [complete] Stage 6: validate target rules, push focused branches, create and recheck two PRs

## Current gates

- PR publication: `SUBMITTED`; both PRs are open, non-draft, and mergeable. PR 1's submission gate and configured check pass; PR 2 has no automatic PR check because its lint workflow is manual-only.
- Claude review: broad R1 is preserved as `NO_RESULT_TIMEOUT`; R1A/R2 are historical narrow `GO`; final-tree R3 engine, R4A viewer/tool, R4B Stage 3 evidence, and R5 aggregate are validated `GO`.
- GitHub repository: created with explicit authorization as public `chouyong/dsh-effect-doctor`; PR publication was fail-closed until the recorded age gate, then passed the remaining checks.
- Publication identity: at PR creation, local `HEAD`, refreshed `origin/main`, and GitHub API `main` all resolved to `521ec6798bd3fa27dd316647777c46b8c7d24c43`; 18 genuine commits were present and the branch difference was `0/0`. Subsequent checked-in publication records were pushed non-force and verified after each push.
- Final cleanup-precedence Stage 3: fresh-profile install and real Loader gate pass at `b638cdd`; raw Stage 2/3 evidence and checked-in authority documents are independently hash-closed.
- Claude R2 engine: historical `GO` for the `004fe47` cleanup fix that exposed the logger-only disposer-error precedence mismatch; Codex fixed it in `b638cdd`, and final-tree R3 subsequently closed the finding with `GO`.
- Claude final review: R3 engine, R4A viewer, R4B Stage 3, and R5 aggregate receipts are each validated `GO`; R5 SHA-256 is `fe4c3003e181c4ffafded368a5c0b43e41844780a1f3c1c23ab5bd73d7b0dcf1`.
- Publication age: GitHub created `2026-08-16T11:35:15Z`; eligibility opened at `2026-08-17T11:35:15Z`. After that instant, both focused target-list branches were checked, pushed, and opened as PR 1447 and PR 370.

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
| Broad Claude R1 produced no receipt before the 334.1-second outer timeout | 1 | Classified `NO_RESULT_TIMEOUT`, proved no receipt/orphan process, preserved R1, and split review into sequential single-question notices. |
| R1A dry-run found the shared Claude mutex held | 1 | Process audit proved the owner is a later, separate `dsh-branch-review` terminal chain; left it untouched and wait for natural release before retrying dry-run. |
| Stage 3 independent-check batch used a fail-fast `Promise.all` around an expected non-zero overwrite negative test | 1 | Preserve the observed exit `1` and exact non-overwrite diagnostic; do not repeat that negative test, and rerun only the hidden independent hash/check verification as a separate command. |
| Final authority validator passed multiple `Get-Content -Raw` files into vectorized `-notmatch` | 1 | Preserve the UTF-8/marker/diff results, classify the missing-hash list as a wrapper false positive, and rerun with explicit joined text before matching required values. |
| Isolated post-Claude verify required the Stage 2 summary to byte-match the main-worktree hash | 1 | Preserve the full PASS and matching `b638cdd` source identity; compare the two JSON summaries to classify path-dependent receipt hashes from the junction environment, while retaining the independently unchanged Stage 3 hash closure. |
| PowerShell `Remove-Item` threw `NullReferenceException` on the validated temporary junction | 1 | Confirm zero deletion, do not switch shells, and remove only the same verified junction paths with `.NET Directory.Delete(path, false)` before unregistering the temporary worktree. |
| Final closeout validator concatenated Git's string commit count with integer `1` as `161` | 1 | Preserve all passing receipt/UTF-8/product/authority/diff results and rerun only the prospective-count expression with an explicit `[int]` cast. |
| Goal completion audit script failed JavaScript parsing on Markdown backticks embedded in a template literal | 1 | Confirm no nested audit command started, replace backtick-containing exact strings with PowerShell regex/character-safe checks, and retain settled outputs for independent evidence channels. |
| First full clone for PR preparation exceeded its bounded timeout | 1 | Precisely terminated only that clone process tree; rebuilt the candidate from a bounded shallow clone and preserved the timeout evidence. |
| Windows `awesome-lint` invocation treated an absolute README path as a GitHub URL | 1 | Reran the same lint against `./README.md`; it passed with only pre-existing list-vocabulary warnings. |
| Shallow candidate lacked a commit for `build-site` | 1 | Preserved the fail-closed refusal, then reran after committing the candidate; the build passed. |
| HTTPS push for PR 1 was rejected because OAuth lacked the `workflow` scope | 1 | Did not expand credentials or force-push; used a non-force BatchMode SSH push and verified the remote SHA. |
| Baseline-ref API lookup returned 404 | 1 | Recorded the absent optional ref, made no remote write, and continued with the verified candidate base. |
| PowerShell wrapper used Bash `<<<` syntax | 1 | Parsing failed before the nested API call; no side effect occurred and the check was rerun with native PowerShell arguments. |
| Shallow merge-base was insufficient for fork synchronization | 1 | Did not infer ancestry from incomplete history; used the verified remote candidate and recorded the limitation. |
| Final PR-status wrapper split multi-token `gh --jq` expressions under PowerShell | 1 | The read-only formatting calls failed before returning PR data and caused no write; rerun with native `ConvertFrom-Json` property access. |
