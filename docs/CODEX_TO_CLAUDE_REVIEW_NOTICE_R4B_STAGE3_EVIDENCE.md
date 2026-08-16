# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R4B_STAGE3_EVIDENCE

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 唯一问题：final `b638cdd` Stage 3 gate 与保存的 raw evidence 是否真实证明 fresh-profile tarball install、DSH bundle composition、real app-boot/Loader/ToolRuntime registration、tool output/schema/render consistency、精确 doctor fiber disposal 和 tool removal；summary/docs/hash/no-Web claims 是否自洽且无夸大。
- 产品内只读文件：`scripts/dsh-real-gate.ts`、`docs/STAGE_3_DSH_GATE.md`、`docs/release-report.md`、`docs/release-evidence.md`、`package.json`、`artifacts/stage-3/b638cdd/runtime-gate/gate-summary.json`、`artifacts/stage-3/b638cdd/runtime-gate/dump-config.txt`、`artifacts/stage-3/b638cdd/runtime-gate/loader.cordis.yml`、`artifacts/stage-3/b638cdd/dsh-home/profiles/effect-doctor-stage3-b638cdd/package.json`、`artifacts/stage-3/b638cdd/dsh-home/profiles/effect-doctor-stage3-b638cdd/node_modules/dsh-effect-doctor/dist/src/dsh-plugin.js`。
- 允许的 DSH 只读支持文件仅限：`D:\knowledgeBase\deepseek-harness\packages\boot\app-boot\lib\index.js`、`D:\knowledgeBase\deepseek-harness\packages\core\tools\lib\index.js`、`D:\knowledgeBase\deepseek-harness\packages\core\system-prompt\lib\index.js`、`D:\knowledgeBase\deepseek-harness\vendor\cordis\lib\index.js`、`D:\knowledgeBase\deepseek-harness\package.json`。
- 产品代码提交：`b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`；证据文档提交：`d8e5a31a2c228510d63aa4e65735e925219da415`；DSH source commit：`47f943859bef60e4160492346772ded9b24f765a`。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R4B_STAGE3_EVIDENCE.md`
- Engine 与 viewer implementation 已由 R3/R4A 独立审核，本轮不重审；aggregate final decision 也不在本轮。

## Baseline

- Final Stage 3 profile/home：`effect-doctor-stage3-b638cdd` / `artifacts/stage-3/b638cdd/dsh-home`，从不存在状态初始化；未使用 active profile。
- Stage 3 summary SHA-256：`42236dd8889feda51938a6f8a7846dab3ff1f36dd83b05f3603a5d6b1e448e63`。
- Tarball SHA-256：`e2380f24d56f5071bc47b1cb7a382bb0abe2ad3dfcb40c8682983a41d974f72b`；installed `dsh-plugin.js`：`034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0`。
- Clean receipt：`d1824d2a59506cfa025d7606176447633de73f3bf44866c2e54e3d1ada2f6746`；vendored Cordis：`1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`。
- Dumped composition：`8a661796bdb78600a4c482cfb5d8a82a282ff77f8b2f8d39b1e4d054632c27a0`；minimal Loader config：`5dbdfb194e503ebe483f26ad4371c532db12a82cfdc5729ee769ecc93ff3de8a`。
- Independent Codex verification found zero hash mismatches, all required booleans true, sensitive property-name matches 0, `webSurface=false`, `screenshotsApplicable=false`; same output directory returned exit `1` and summary hash remained unchanged.

## 变更意图

Gate 必须 fail closed：先确认安装 profile/manifest/entry files，调用真实 DSH source CLI `--dump-config`，用 `@deepseek-ai/dsh-app-boot` boot 最小 Loader tree，取得真实 `ToolRuntime` service 和 registered tool，执行并用真实 JSON Schema validator 验证，和独立 receipt parser/render 比较，最后只 dispose `include:effect-doctor` fiber 并证明 tool registration 消失。任何缺文件、stderr、schema/output/render mismatch、fiber/tool residue 或已有 output directory 都必须非零失败。

## Project Guardrails

- 只读审核；只可使用 `Read,Glob,Grep`，不得使用 Bash、PowerShell、Write/Edit、Agent、WebFetch/WebSearch。
- 不修改文件/外部状态，不读取凭据、生产、active profile、session/model/tool history，不启动其它模型或子代理。
- 不读取 `D:\knowledgeBase\dsh-branch-review`；除上列五个 DSH 支持文件外不读取其它外部项目文件。
- `GO` 仅限 final Stage 3 evidence 技术范围，不代表 aggregate final、发布、PR、安全或真人批准。

## Reproduction Commands

Codex 已执行；Claude 本轮禁止 shell：

```text
npm pack --pack-destination artifacts/stage-3/b638cdd --json
pnpm dsh plugin --profile effect-doctor-stage3-b638cdd add <exact-tarball>
node dist/scripts/dsh-real-gate.js --dsh-source D:\knowledgeBase\deepseek-harness --dsh-home <exact-isolated-home> --profile effect-doctor-stage3-b638cdd --receipt <exact-clean-receipt> --tarball <exact-tarball> --out-dir <fresh-runtime-gate>
npm run verify
```

## Known Gaps

- Claude safe-mode 不执行 install、dump-config、Loader、hash 或 tests；它静态审核 gate、DSH built entries 和保存 evidence。真实执行由 Codex 的独立命令负责。
- Tarball 二进制本身不要求 Claude 解包；package content contract 已由 `npm pack --json` 与 tests 验证，hash 身份记录在 summary/docs。
- 产品无 client/Web surface；截图/GIF/browser gates 是 `NOT_APPLICABLE_NO_WEB_SURFACE`，不是缺失或替代证据。

## 审核重点

1. gate 是否真实 import/boot DSH app-boot、tools runtime、system-prompt 和 installed plugin，而不是 mock；是否从真实 ToolRuntime 取 tool、执行、schema validate 并与独立 parser/render 比较。
2. precise disposal 是否只针对 `include:effect-doctor` fiber，并同时证明 fiber uid null 与 `tools.get()` undefined；finally 是否可靠清理整个 test root。
3. fresh output/non-overwrite、child ownership/timeout/stderr、profile manifest/bundle/dump-config checks 是否 fail closed；summary 六项 hashes 与 raw files/docs 是否完全一致。
4. no-Web/截图不适用、`PASS_AFTER_CHANGES`、无 secret/active-profile mutation 和 PR 禁止是否如实表述。

## Forbidden Actions

- 禁止 Bash/PowerShell、Write/Edit、commit、push、部署、服务/计划任务、凭据和外部消息。
- 禁止 Codex、Claude 子会话、Agent、其它模型、WebFetch/WebSearch。
- 禁止读取未列出的外部项目、active profile 或使用权限绕过。

## 回执契约

只输出以下结构，唯一末行为判定：

```text
## Findings
## Actions Executed and Not Executed
## Review Scope
## Evidence Gaps
## Residual Risks
FINAL_DECISION: GO
```

任何阻断项或证据不足必须使用 `FINAL_DECISION: HOLD`。
