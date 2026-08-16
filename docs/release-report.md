# DSH Plugin Release Report

## Outcome

`PASS_AFTER_CHANGES`

## Scope and Identity

- Repository: `chouyong/dsh-effect-doctor`
- Source commit: `b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`
- Plugin artifact: prebuilt `dsh-effect-doctor-0.1.0.tgz`; identity recorded in `docs/STAGE_3_DSH_GATE.md`
- DSH runtime: source commit `47f943859bef60e4160492346772ded9b24f765a`, vendored Cordis `4.0.1`
- Effective home/profile: `artifacts/stage-3/b638cdd/dsh-home` / `effect-doctor-stage3-b638cdd`

## Gate Results

| Gate | Result | Evidence |
|---|---|---|
| Build/typecheck/tests | `PASS` | `npm run verify`: unit `17/17`, real `4/4`, seven receipts, zero skips |
| Plugin installation | `PASS` | Fresh D-drive profile, prebuilt tarball, no fallback |
| Bundle composition | `PASS` | Installed `dsh-effect-doctor` layer in real DSH dump-config |
| Tool execution | `PASS` | Registered tool output/schema/render match the completed receipt |
| Plugin disposer | `PASS` | Disposing only the doctor entry removes the tool registration |
| Runtime client/style/errors | `NOT_APPLICABLE_NO_WEB_SURFACE` | No client export or browser bundle exists |
| Fork/geometry/navigation | `NOT_APPLICABLE_PRODUCT_SCOPE` | Product is a host-only cleanup receipt viewer, not a fork visualization |
| Genuine screenshots | `NOT_APPLICABLE_NO_WEB_SURFACE` | No screenshots or GIFs were created |
| Commit/push/PR | `PARTIAL_WAITING_ELIGIBILITY` | 15 functional commits pushed; PR forbidden pending age and Claude final `GO` |

The canonical Stage 3 commands, machine summary, checks, hashes, and limitations are in `docs/STAGE_3_DSH_GATE.md`.

## Changes Before Pass

- Stage 1 adapter probing exposed Cordis's callable logger service; the structural predicate was corrected.
- TypeScript activation and fixture-only thenable declarations were corrected before the first complete engine gate.
- The Stage 3 gate initially hid its nested failure detail; bounded AggregateError/cause reporting was added.
- The sandbox blocked the gate-owned child with `spawn EPERM`; the exact gate command received narrow host approval.
- Windows Node 25 required Loader module names as `file:///` URLs rather than drive-letter paths.
- DSH app boot nests configured entries below its pinned `include` entry; the disposer gate now resolves `include:effect-doctor`.

No formal `b638cdd` install fallback or runtime retry was needed after these source and gate corrections. The earlier `cd0d0f7` and `004fe47` sealed artifacts remain preserved as history. The historical corrections permanently require `PASS_AFTER_CHANGES`.

## Secrets and Side Effects

- Secret persisted: `false`
- Session/product state changed: none; only the isolated D-drive profile and generated evidence were created
- Processes stopped: none; the bounded dump-config child and Loader process exited normally
- Remaining gaps: post-fix Claude independent review, Claude final aggregate `GO`, and GitHub 24-hour repository-age eligibility

## Publication

- Commit SHA: `b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`
- PR URLs: none; status `WAITING_ELIGIBILITY`
- Screenshot paths: none; `NOT_APPLICABLE_NO_WEB_SURFACE`
