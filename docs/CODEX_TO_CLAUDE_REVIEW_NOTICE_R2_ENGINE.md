# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R2_ENGINE_POST_FIX

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 唯一问题：当前 `src/engine.ts` 的 exercise timeout 路径是否在保持 primary `FAIL_TIMEOUT` 的同时，对已 mount fiber 执行 bounded unmount，并在 cleanup 失败时保守地返回 `FAIL_DISPOSE`；`tests/engine.test.ts` 是否真实覆盖这个修复且没有打开 false `PASS` 路径。
- 只读文件：`src/engine.ts`、`tests/engine.test.ts`、`src/contracts.ts`、`docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R1A_ENGINE.md`、`docs/STAGE_2_ISOLATED_GATE.md`、`docs/release-evidence.md`、`artifacts/stage-2/gate-summary.json`。
- 修复提交：`004fe47cd343163e9e945b226966436fcb0bdd35`；直接父提交：`7ab7d255064b4d0e250cda318371262498c09d0b`。
- 证据文档提交：`a22acce241c52c54fda12d26be9507ff5b530494`；它不改变 engine 或测试源码。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R2_ENGINE.md`
- DSH viewer、bundle、Stage 3 integration 和发布资格不在本轮；后续独立小范围审核负责。

## Baseline

- 当前 `HEAD`、`origin/main` 与 GitHub API `main`：`a22acce241c52c54fda12d26be9507ff5b530494`；tracked worktree clean，只有根规则投影未跟踪且不属于产品。
- R1A engine receipt SHA-256：`3578772c40ea9060b5bb13866f71c1568c6c2e60e6669ae377fabbed5c96c33a`；唯一末行为 `FINAL_DECISION: GO`，但其范围是修复前 tree，并明确发现 exercise timeout 提前返回且跳过 unmount。
- 修复后 `npm run verify`：unit `17/17`、real Cordis `4/4`、isolated receipts `7`、skipped `0`。
- 修复后 Stage 2 raw summary：source commit `004fe47cd343163e9e945b226966436fcb0bdd35`，SHA-256 `1f165e95d8ace889853883cf74ebd74e9a75263f6ab74ca646bed1121b40ea60`。
- Runtime：DSH vendored `@deepseek-ai/cordis@4.0.1`，module SHA-256 `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`。

## 变更意图

修复前，exercise callback 超时会立即返回 `FAIL_TIMEOUT`，导致已经 mount 的 fiber 未被 dispose。修复后，exercise timeout 只记录 primary failure，控制流继续进入现有 bounded unmount；unmount 成功时最终仍是 `FAIL_TIMEOUT`，而 unmount 抛错或记录 disposer error 时返回更保守的 `FAIL_DISPOSE`。任何路径都不得把 timeout 或 cleanup failure 降级为 `PASS`。

## Project Guardrails

- 遵守项目和用户全局规则。
- 只读审核；只可使用 `Read,Glob,Grep`，不得使用 Bash、PowerShell、Write/Edit、Agent、WebFetch/WebSearch。
- 不修改文件或外部状态，不读凭据，不访问生产，不启动其它模型或子代理。
- 不读取 `D:\knowledgeBase\dsh-branch-review`；该目录由另一个终端独占且完全不在范围内。
- `GO` 仅限本通知声明的 post-fix engine 技术范围，不代表 Stage 3、发布、PR、安全或真人批准。

## Reproduction Commands

以下命令由 Codex 已在精确修复提交上真实执行；Claude 本轮权限禁止 shell，因此只审核代码、测试和已保存证据：

```text
npm run verify
```

Codex 会在回执后再次独立运行最高信号检查，不以 Claude 自报代替执行证据。

## Known Gaps

- Claude safe-mode 不执行测试或 Git 命令；它审查当前源码、回归测试、R1A finding 与 raw Stage 2 summary。
- 本轮不重新审核 R1A 已覆盖的全部 adapter/fixture/lock 逻辑，只判断该 finding 的修复是否正确且未引入新的 false `PASS`。
- 仓库 24 小时、Stage 3 viewer/evidence 和最终 aggregate `GO` 是独立门禁，不能由本轮 engine `GO` 覆盖。

## 审核重点

1. exercise timeout 后是否一定继续到 bounded unmount，而普通 exercise error 的既有行为是否保持失败关闭。
2. cleanup 成功时 primary `FAIL_TIMEOUT` 是否保持；cleanup 抛错、超时或 logger disposer error 是否优先成为 `FAIL_DISPOSE`/`FAIL_TIMEOUT`，且绝无 `PASS`。
3. `exercise timeout still disposes the mounted fiber` 是否真正断言 dispose 已执行、outcome/exit code 正确，并能在旧实现上失败。

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
