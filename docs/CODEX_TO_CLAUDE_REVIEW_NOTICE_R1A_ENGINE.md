# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R1A_ENGINE（R1 broad review timed out without a receipt）

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 唯一问题：core engine 是否真实、失败关闭地证明声明范围内的 Cordis-managed cleanup，是否存在足以阻断发布的实现/测试/证据缺陷？
- 只读文件：`src/contracts.ts`、`src/compare.ts`、`src/cordis-adapter.ts`、`src/engine.ts`、`src/fixtures.ts`、`src/lock.ts`、`src/runtime-loader.ts`、`scripts/real-gate.ts`、`tests/contracts.test.ts`、`tests/engine.test.ts`、`tests/real-cordis.test.ts`、`docs/STAGE_2_ISOLATED_GATE.md`、`docs/release-evidence.md`、`README.md`。
- 可读 raw 证据：`artifacts/stage-2/`。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1A_ENGINE.md`
- DSH viewer/Stage 3 integration 不在本轮；将由后续独立小范围审核。

## Baseline

- Product HEAD/origin/GitHub：`7ab7d255064b4d0e250cda318371262498c09d0b`；tracked worktree clean。
- Runtime：DSH vendored `@deepseek-ai/cordis@4.0.1`，module SHA-256 `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`。
- Final HEAD verify：unit `16/16`、real Cordis `4/4`、isolated receipts `7`、skipped `0`。
- Current Stage 2 raw summary：source commit `7ab7d255064b4d0e250cda318371262498c09d0b`，SHA-256 `b226b4137b03ee28947ea44734a8b5830a443cca926ad9fd7a2b26470903e229`。
- `docs/STAGE_2_ISOLATED_GATE.md` 固化早期稳定 gate `0b1e7c0`；raw artifacts 可再生，当前 final-HEAD hash 与历史 hash 不同且已明确区分。

## 变更意图

只证明 version adapter 明确观察的 Cordis-managed fibers/runtimes/effects/listeners/services 在 mount/exercise/unmount/settle 后回到 baseline。private surface/version drift、dispose error、timeout、mount/exercise failure 和 lock conflict 必须非零且不能降级成 PASS。不证明裸 timer、DOM/global listener、native handle、外部进程、任意 heap leak 或 session/business data。

## Project Guardrails

- 只读审核；只可使用 `Read,Glob,Grep`。
- 不修改文件/外部状态，不读凭据，不访问生产，不启动其它模型/Agent。
- 不读取 `D:\knowledgeBase\dsh-branch-review`。
- `GO` 只代表本轮 core engine 技术范围。

## Reproduction Commands

Codex 已执行；Claude 本轮不得执行 shell：

```text
npm run verify
```

## Known Gaps

- 本轮不审核 host-only DSH viewer、bundle install 或 Stage 3 artifact；后续小范围审核负责。
- Claude safe-mode 不执行测试；只审代码与已保存证据。
- 仓库未满 24 小时，PR 仍禁止；这不属于 core engine 技术判定。

## 审核重点

1. adapter 私有面/version/shape 是否严格集中且 fail closed。
2. clean/leak/dispose error/timeout/startup/version fixtures 与 exit codes 是否真实区分。
3. observer noise、settle stability、single-run lock、Cordis 吞 disposer error 后的 logger cursor 捕获是否可靠。
4. receipt 是否确定性且没有夸大覆盖或泄露受禁数据。

## Forbidden Actions

- 禁止 Bash/PowerShell、Write/Edit、commit、push、部署、服务/计划任务、凭据和外部消息。
- 禁止 Codex、Claude 子会话、Agent、其它模型、WebFetch/WebSearch。
- 禁止权限绕过。

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

任何阻塞项或证据不足必须使用 `FINAL_DECISION: HOLD`。
