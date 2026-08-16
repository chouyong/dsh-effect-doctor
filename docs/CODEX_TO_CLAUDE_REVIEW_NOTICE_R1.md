# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R1

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 审核对象：最终 tracked tree `7ab7d255064b4d0e250cda318371262498c09d0b` 的全部产品源码、测试、脚本、package/bundle 清单、README 与 `docs/` 证据；重点文件为 `src/cordis-adapter.ts`、`src/engine.ts`、`src/receipt-viewer.ts`、`src/dsh-plugin.ts`、`scripts/real-gate.ts`、`scripts/dsh-real-gate.ts`、`tests/`、`docs/STAGE_2_ISOLATED_GATE.md`、`docs/STAGE_3_DSH_GATE.md`、`docs/release-evidence.md`、`docs/release-report.md`。
- 可读 raw 证据：`artifacts/stage-2/` 与 `artifacts/stage-3/cd0d0f7/`；它们被 Git 忽略但由本轮真实命令生成并保留。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1.md`
- `.claude/`、`.codex/`、根 `AGENTS.md`/`CLAUDE.md` 是环境规则投影，不是产品提交；只按规则使用，不把它们列为产品变更。
- 只审上述范围；范围外变化只记录，不顺手修改。

## Baseline

- Git 基线：产品由 12 个真实提交构成；当前 `HEAD`、`origin/main` 与 GitHub API 均为 `7ab7d255064b4d0e250cda318371262498c09d0b`。
- 当前状态：tracked worktree clean；仅有已知未跟踪规则投影，生成 evidence/artifacts 被 `.gitignore` 排除。
- Stage 0 决策：`GO_ENGINE`。
- 最终 HEAD `npm run verify`：unit `16/16`、real Cordis `4/4`、isolated receipts `7`、skipped `0`，Stage 2 current summary source commit `7ab7d255064b4d0e250cda318371262498c09d0b`。
- Stage 2 current raw summary SHA-256：`b226b4137b03ee28947ea44734a8b5830a443cca926ad9fd7a2b26470903e229`。`docs/STAGE_2_ISOLATED_GATE.md` 另记录最初稳定 gate commit `0b1e7c0` 的历史 hash；raw artifacts 可再生，因此当前 raw hash 随最终 HEAD 身份更新，这不是把历史 hash 改写为当前 hash。
- Stage 3 sealed code commit：`cd0d0f7990ef5f6c8b65cc78b74af13ff39971a8`；证据文档提交：`7ab7d255064b4d0e250cda318371262498c09d0b`。
- Stage 3 summary SHA-256：`a6ab72e3bab944af4d4a3bda2c8d553955ba67b912c561c4ab0b1b22f2c02d1b`。
- Stage 3 tarball SHA-256：`dd9efec8af86456699a6ab9019c7062e4a4ad3a5fd37246b73231af9b408a85a`；installed plugin SHA-256：`034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0`。
- DSH source commit：`47f943859bef60e4160492346772ded9b24f765a`；vendored Cordis module SHA-256：`1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`。

## 变更意图

本产品只证明一个限定命题：指定 fixture 经 `baseline -> mount -> exercise -> unmount -> settle -> compare` 后，版本 adapter 声明可观察的 Cordis-managed 资源是否回到基线。未知版本/结构必须失败关闭；dispose error、timeout、leak、startup/exercise failure 必须分离且非零退出；receipt 不得包含 session、prompt、tool payload 或 secret。

Stage 3 额外提供一个 host-only、只读 DSH tool，只读取配置中已经完成的 JSON receipt，严格校验并投影白名单摘要。它不得启动审计、接受模型指定路径、卸载 live target、读取 session 内容或创建 Web surface。工具注册必须由 DSH ToolRuntime effect 所有，卸载 doctor entry 后注册必须消失。

## Project Guardrails

- 遵守项目和用户全局规则。
- 只读审核，不修改任何文件或外部状态。
- 只可使用 `Read,Glob,Grep`；不得使用 Bash、Write/Edit、Agent、WebFetch/WebSearch。
- 不读取凭据，不访问生产，不启动新的模型或子代理。
- 不读取 `D:\knowledgeBase\dsh-branch-review`；该目录由另一个终端独占且完全不在范围内。
- 不把 `GO` 冒充安全审核、生产批准、真人裁决或 PR 授权。
- `GO` 仅限本通知声明的技术范围。

## Reproduction Commands

以下命令由 Codex 已真实执行并在文档/raw evidence 中留证。Claude 本轮权限禁止 Bash，因此只审核命令、代码与结果，不执行这些命令：

```text
npm ci --ignore-scripts
npm run verify
npm pack --pack-destination artifacts/stage-3/cd0d0f7 --json
pnpm dsh plugin --profile effect-doctor-stage3-cd0d0f7 add <exact-tarball>
node dist/scripts/dsh-real-gate.js --dsh-source D:\knowledgeBase\deepseek-harness --dsh-home <isolated-D-drive-home> --profile effect-doctor-stage3-cd0d0f7 --receipt <exact-clean-receipt> --tarball <exact-tarball> --out-dir <fresh-stage3-evidence-dir>
```

Codex 在 Claude 回执后会再次独立运行最高信号检查，不以 Claude 自报代替执行证据。

## Known Gaps

- 本产品没有 client export、browser bundle、slot、style 或 Web surface；HTTP/style/browser console/page/request、截图、GIF、fork geometry/navigation 门禁是 `NOT_APPLICABLE_NO_WEB_SURFACE`，不是未补的 UI 证据。
- Claude safe-mode 不执行测试或 shell 命令；它审核当前代码、tracked evidence 与保留的 raw artifacts。机器执行真实性仍由 Codex 的独立命令负责。
- GitHub 仓库创建时间为 `2026-08-16T11:35:15Z`，最早 24 小时资格为 `2026-08-17T11:35:15Z`。当前未满 24 小时，PR 明确禁止；这不应被 Claude `GO` 覆盖。
- `docs/STAGE_2_ISOLATED_GATE.md` 固化最初稳定 Stage 2 run；当前 raw Stage 2 artifacts 来自最终 HEAD 重跑，二者 source commit/hash 不同且已在 Baseline 明确区分。

## 审核重点

1. `src/cordis-adapter.ts` 是否把所有 private/internal 观察集中并严格 pin 到 Cordis `4.0.1`，结构漂移是否确实得到 `UNVERIFIABLE_*` 而非 PASS。
2. clean/leaky/throwing/hanging/startup/unknown fixtures 是否真实区分资源回基线、残留、dispose error、timeout、mount failure 与 version failure；observer 自身是否不会制造 delta。
3. timeout、单运行锁、退出码、error cursor/logger 行为是否失败关闭，尤其 Cordis 吞 disposer error 后是否仍被可靠捕获。
4. `src/receipt-viewer.ts` 是否严格限制 byte/UTF-8/JSON/schema/exit consistency，是否可能通过额外字段、错误消息或路径读取泄露任意内容。
5. `src/dsh-plugin.ts` 与 `scripts/dsh-real-gate.ts` 是否真正 host-only/read-only，是否使用真实 ToolRuntime/Loader 构件，是否准确证明精确 doctor disposal 后工具注册消失。
6. Stage 2/3 文档、raw summary、source commit、tarball/plugin/runtime/hash 之间是否自洽；`PASS_AFTER_CHANGES`、无 Web surface和 PR 禁止是否被如实表述。

## Forbidden Actions

- 禁止 Write/Edit、commit、push、部署、服务重启、计划任务、凭据访问和外部消息。
- 禁止 Bash、PowerShell、任何 shell 或测试命令；本轮只开放 Read/Glob/Grep。
- 禁止调用 Codex、Claude 子会话、Agent 或其它模型。
- 禁止 WebFetch/WebSearch，禁止读取生产或 active profile。
- 禁止使用权限绕过参数。

## 回执契约

按以下顺序输出，并以唯一末行收口：

```text
## Findings
## Actions Executed and Not Executed
## Review Scope
## Evidence Gaps
## Residual Risks
FINAL_DECISION: GO
```

存在任何阻塞项或证据不足时，末行必须改为 `FINAL_DECISION: HOLD`。
