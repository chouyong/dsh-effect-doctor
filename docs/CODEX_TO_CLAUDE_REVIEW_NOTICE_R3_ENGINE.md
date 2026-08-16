# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R3_ENGINE_FINAL_TREE

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 唯一问题：R2 finding 7 是否已在最终 engine tree 中正确修复——当 exercise timeout 或其它 primary failure 后的 dispose 被 Cordis 吞掉并只通过 adapter logger 投影为 unmount error 时，receipt 是否返回 `FAIL_DISPOSE` 而不是被 primary outcome 覆盖；新增测试是否真实锁定该优先级且没有 false `PASS`。
- 只读文件：`src/engine.ts`、`tests/engine.test.ts`、`src/contracts.ts`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R2_ENGINE.md`、`docs/STAGE_2_ISOLATED_GATE.md`、`docs/release-evidence.md`、`artifacts/stage-2/gate-summary.json`。
- 最终 engine 修复提交：`b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`；直接父提交：`a22acce241c52c54fda12d26be9507ff5b530494`。
- 最终证据文档提交：`d8e5a31a2c228510d63aa4e65735e925219da415`；它不改变 engine 或测试源码。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R3_ENGINE.md`
- DSH viewer、bundle、Stage 3 artifact consistency 和 aggregate final decision 不在本轮。

## Baseline

- 当前 `HEAD`、`origin/main` 与 GitHub 提交：`d8e5a31a2c228510d63aa4e65735e925219da415`；tracked worktree clean，只有根规则投影未跟踪且不属于产品。
- R2 receipt SHA-256：`7c81697cf904b3c24124a68382f0d59531efe19c3f93031f3f6568199c1b52ae`；唯一末行 `FINAL_DECISION: GO`，但它明确指出 logger-only unmount error 在 `primaryFailure` 之后检查，且其范围不覆盖后续修复。
- 最终 `npm run verify`：unit `17/17`、real Cordis `4/4`、isolated receipts `7`、skipped `0`。
- 最终 Stage 2 raw summary：source commit `b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`，SHA-256 `53d0834bce9c3a86d95051f0a7f332d13fbbfc4268c7e447a24165f7b9cfa914`。
- Runtime：DSH vendored `@deepseek-ai/cordis@4.0.1`，module SHA-256 `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`。

## 变更意图

最终 engine 在 unmount 后先检查 `errors.some(error.phase === 'unmount')`，再返回任何 pending `primaryFailure`。因此 cleanup 成功时 exercise timeout 仍是 `FAIL_TIMEOUT`；dispose throw/reject 与 logger-only swallowed disposer error 都优先成为 `FAIL_DISPOSE`；unmount timeout 仍由 catch 返回 `FAIL_TIMEOUT`。任何组合都不得产生 `PASS`。

## Project Guardrails

- 遵守项目和用户全局规则。
- 只读审核；只可使用 `Read,Glob,Grep`，不得使用 Bash、PowerShell、Write/Edit、Agent、WebFetch/WebSearch。
- 不修改文件或外部状态，不读凭据，不访问生产，不启动其它模型或子代理。
- 不读取 `D:\knowledgeBase\dsh-branch-review`。
- `GO` 仅限本通知声明的最终 engine precedence 技术范围，不代表 Stage 3、发布、PR、安全或真人批准。

## Reproduction Commands

以下命令由 Codex 已在精确 engine commit 上真实执行；Claude 本轮禁止 shell：

```text
npm run verify
```

Codex 会在回执后独立重跑最高信号检查。

## Known Gaps

- Claude safe-mode 不执行测试或 Git 命令；它审核当前源码、测试、R2 finding 与保存的 Stage 2 evidence。
- 本轮只判断 cleanup-error precedence 修复，不重审 adapter 的全部 private surface 或 viewer/Stage 3。
- 仓库年龄、viewer/evidence 审核和 aggregate final `GO` 仍是独立门禁。

## 审核重点

1. logger-only unmount error 是否在所有 pending primary failures 之前稳定映射为 `FAIL_DISPOSE`，而 unmount timeout catch 仍保持 `FAIL_TIMEOUT`。
2. cleanup 成功后 primary `FAIL_TIMEOUT`/`FAIL_EXERCISE` 是否保持，且错误优先级交换没有让任何路径跳过非 PASS return。
3. 新增的 `loggedResult` 子用例是否在旧顺序上失败、在新顺序上证明 unmount error 和 `FAIL_DISPOSE`，同时原 clean/rejecting 子用例仍覆盖其各自行为。

## Forbidden Actions

- 禁止 Bash/PowerShell、Write/Edit、commit、push、部署、服务/计划任务、凭据和外部消息。
- 禁止 Codex、Claude 子会话、Agent、其它模型、WebFetch/WebSearch。
- 禁止读取范围外项目或使用权限绕过参数。

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
