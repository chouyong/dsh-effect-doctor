# Codex -> Claude 独立审核通知

状态：READY_FOR_REVIEW
轮次：R4A_VIEWER_TOOL_CONTRACT

## Review Scope

- 项目根目录：`D:\knowledgeBase\dsh-effect-doctor`
- 唯一问题：host-only DSH receipt viewer/tool 是否真正只读、严格白名单、bounded、零参数且由 doctor fiber 所有；是否存在任意路径读取、额外字段泄露、模型输入控制路径、active profile mutation、live target unload、第二 Web/React surface 或 disposer 遗漏等阻断缺陷。
- 只读文件：`src/receipt-viewer.ts`、`src/dsh-plugin.ts`、`tests/receipt-viewer.test.ts`、`tests/dsh-plugin.test.ts`、`tests/bundle.test.ts`、`cordis.patch.yml`、`package.json`、`README.md`、`artifacts/stage-3/b638cdd/dsh-home/effect-doctor/latest/receipt.json`。
- 产品代码提交：`b638cdd55e1fdb1c39e9b1f8eaab3070d737f55d`；证据文档提交：`d8e5a31a2c228510d63aa4e65735e925219da415`。
- 目标回执：`D:\knowledgeBase\dsh-effect-doctor\docs\CLAUDE_TO_CODEX_REVIEW_RECEIPT_R4A_VIEWER.md`
- Stage 3 gate script、installed artifact hashes、dump-config/Loader evidence 和 aggregate final decision 不在本轮；下一独立小范围审核负责。

## Baseline

- 当前远端发布身份：`HEAD == origin/main == GitHub main == d8e5a31a2c228510d63aa4e65735e925219da415`；该文档提交的父提交 `b638cdd` 是最终产品源码。
- 最终 `npm run verify`：unit `17/17`、real Cordis `4/4`、isolated receipts `7`、skipped `0`。
- Final installed `dsh-plugin.js` SHA-256：`034c33d9bc8ba535f8dd569bbfc06ba5de9f25ed03863d8f416812e8fbfa35e0`。
- Clean viewer receipt SHA-256：`d1824d2a59506cfa025d7606176447633de73f3bf44866c2e54e3d1ada2f6746`；outcome `PASS` / exit `0`。

## 变更意图

产品的 DSH surface 只读取管理员在 bundle config 中指定的、已经完成的 JSON receipt。模型调用没有参数，不能选择路径或启动审计。reader 在读取前限制字节数，严格校验 schema/allowed keys/outcome-exit consistency，并重新投影最小 summary；plugin 只注册一个 tool，注册生命周期由 `ctx.tools.register()` 的 Cordis effect/disposer 所有。产品没有 client export、browser bundle、slot、style 或 Web surface。

## Project Guardrails

- 只读审核；只可使用 `Read,Glob,Grep`，不得使用 Bash、PowerShell、Write/Edit、Agent、WebFetch/WebSearch。
- 不修改文件/外部状态，不读取凭据、生产、active profile、session/model/tool history，不启动其它模型或子代理。
- 不读取 `D:\knowledgeBase\dsh-branch-review`。
- `GO` 仅限本通知的 viewer/tool contract，不代表 Stage 3 artifact identity、发布、PR、安全或真人批准。

## Reproduction Commands

Codex 已执行，Claude 本轮禁止 shell：

```text
npm run verify
npm pack --pack-destination artifacts/stage-3/b638cdd --json
```

## Known Gaps

- Claude 不执行测试、pack 或 Loader；只审核源码、测试、package/bundle contract 与一份 clean receipt。
- 本轮不判断 Stage 3 gate script 是否真实 boot DSH Loader，下一轮负责。
- 无 Web surface，因此 browser HTTP/style/page/console/request、截图和 GIF 不是本轮缺失证据，也不得由 `GO` 推断存在。

## 审核重点

1. reader 是否拒绝 oversized、invalid UTF-8/JSON、unknown/missing keys、错误类型、非法 outcome/exit 组合，并且不会回传未知字段、路径、错误消息或任意原始 JSON。
2. tool declaration 是否真正零参数、read-only、只使用 fixed config path；apply 是否对不安全配置 fail loud before registration，注册 disposer 是否归 doctor fiber 所有。
3. `package.json` / `cordis.patch.yml` / bundle tests 是否只发布 host output，无 client/Web/second React surface，且 README scope/no-live-unload/no-general-leak claims 与实现一致。

## Forbidden Actions

- 禁止 Bash/PowerShell、Write/Edit、commit、push、部署、服务/计划任务、凭据和外部消息。
- 禁止 Codex、Claude 子会话、Agent、其它模型、WebFetch/WebSearch。
- 禁止读取 active profile、范围外项目或使用权限绕过。

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
