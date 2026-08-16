# `dsh-effect-doctor` Codex 开发启动任务

你当前唯一可写的产品目录是：`D:\knowledgeBase\dsh-effect-doctor`。

立即开始技术 spike 和开发，不要只输出建议。Codex 负责架构、实现、测试、隔离运行、证据、Git 历史和 PR 准备；Claude 只在实现与证据稳定后进行独立、只读、失败关闭的技术审核，不参与编码。

## 一、目录与并行边界

- 只修改 `D:\knowledgeBase\dsh-effect-doctor`。
- `D:\knowledgeBase\dsh-branch-review` 由另一个 Codex 终端独占，禁止读取其未完成文件、修改、提交或协调其实现。
- `D:\knowledgeBase\dsh-session-tree`、`D:\knowledgeBase\dsh-fork-diff`、`D:\knowledgeBase\deepseek-harness` 和 `D:\knowledgeBase\cordis` 仅作只读事实源，禁止修改。
- 先检查本目录、父目录和目标源码目录内适用的 `AGENTS.md` / `CLAUDE.md`，遵守更深层规则。
- 保留所有既有用户文件和脏工作树，不执行清理、reset、checkout 覆盖或跨仓迁移。

## 二、必须使用的工作流

1. 使用 `$planning-with-files`：创建并持续更新 `task_plan.md`、`findings.md`、`progress.md`；所有技术假设先落证据，所有失败记录且不原样重复。
2. 使用 `$dsh-plugin-real-release-gate`：按 Stage 0→4 预注册真实构建、安装、隔离运行、DSH 集成、截图和发布证据；最终只能给出 `FIRST_PASS`、`PASS_AFTER_CHANGES` 或 `FAIL`。
3. 使用 `$codex-claude-cli-review`：实现、测试和证据稳定后才调用 Claude；先 dry-run，再单链只读审核；`HOLD` 后保留 R1，修复后新建 R2。
4. 如果本目录还没有 `.codegraph/`，本提示明确授权你运行 `codegraph init -i`。结构问题先用 CodeGraph；字面文本才用 `rg`/直接读取。
5. 所有文本使用 UTF-8；编辑使用原生 `apply_patch`；每阶段完成后做严格 UTF-8、`git diff --check` 和定向验证。

## 三、产品目标

一句话：证明一个 DSH/Cordis 插件在 mount → exercise → unmount 后，Cordis 管理的运行时资源回到基线。

产品不是依赖拓扑图、静态安全扫描、安装健康检查或“能否加载”测试。核心输出是可复核 receipt：

```text
baseline -> mount -> exercise -> unmount -> settle -> compare -> PASS / FAIL / UNVERIFIABLE
```

优先做开发者 CLI/engine 和机器可读 receipt；只有 engine 在隔离环境中可证明后，再添加最小 DSH tool/Settings UI 展示，不允许为了截图先做空壳面板。

## 四、不可违反的真实性边界

- 只证明实际可观察、由 Cordis 管理或明确 instrumentation 覆盖的资源。
- 不声称能发现裸 `setTimeout`、全局 DOM listener、native handle、外部进程、任意内存泄漏或绕过 Cordis 的资源，除非对应 instrumentation 已实现并有对抗测试。
- Cordis 的 `internal/*` 事件、`Fiber._disposables`、`EventsService._hooks` 等属于非稳定观察面；必须集中在版本 adapter，未知版本或结构变化一律 `UNVERIFIABLE`/非零退出，禁止猜测或静默降级为 PASS。
- 不在用户正在使用的生产 profile 中擅自 disable/unload 第三方插件。审计优先在隔离 D 盘临时 profile、独立 Cordis context 或子进程中执行。
- 不读取或输出会话正文、prompt、tool arguments/results、凭据、Cookie、环境 secret、数据库内容或插件私有业务数据。
- receipt 只记录资源类型、稳定身份/标签、计数、生命周期状态、版本、哈希和必要错误摘要；不得把未知对象粗暴序列化。
- 不把 Claude `GO`、自动化 PASS 或本工具 receipt 冒充真人安全审计、插件无漏洞证明或生产批准。

## 五、Stage 0 技术 spike：先证明可行再承诺产品

使用 CodeGraph 对 `D:\knowledgeBase\cordis` 与 `D:\knowledgeBase\deepseek-harness` 做结构核验，并把结论写入 `findings.md`：

- `RegistryService`、`Fiber`、`FiberState`、`ctx.effect`、disposable collection、event hooks、timer service、loader `Entry` 的真实定义和调用关系。
- 哪些资源可通过公开 API 观察，哪些只能通过 private/internal adapter，哪些完全不可证明。
- 如何在隔离 context/profile 中 mount 指定 fixture、执行明确 probe、await settle、dispose，并区分 dispose error、timeout、残留和观察器自身噪声。
- 观察器自身注册的 fiber/listener/timer 如何从 baseline/delta 中排除且仍可审计。
- DSH 插件入口是否适合直接运行审计；如果实时卸载 API 不安全，v1 必须是独立开发 CLI + 可选只读结果展示，而不是宣称 live profiler。
- 与 `qidiai/dsh-contrib-topology`、`ayahunter/dsh-plugin-clinic`、`iiwish/dsh-testkit`、plugin sentinel/doctor 类产品的边界。无命中不能宣称“首个”。

Stage 0 必须产出明确决策：`GO_ENGINE` 或 `NO_GO_UNRELIABLE_SURFACE`。如果关键 mount/unmount/snapshot 路径无法可靠验证，不得用 UI 包装掩盖；如实收口为技术 spike 失败并给出最小上游 API 建议。

## 六、MVP 验收范围

- 版本化 adapter：明确支持的 Cordis/DSH 版本、探测条件和 fail-closed 分支。
- 版本化 snapshot/receipt schema，至少记录运行时身份、目标插件、阶段、可观察资源类别、before/after/delta、settle/timeout、errors、outcome 和 schemaVersion。
- outcome 至少区分 `PASS`、`FAIL_LEAK`、`FAIL_DISPOSE`、`FAIL_TIMEOUT`、`UNVERIFIABLE_VERSION`、`UNVERIFIABLE_SURFACE`；所有失败/不可验证结果使用非零退出码，不用 `assert` 表达红线。
- 隔离 runner：mount 一个明确 fixture，执行可选 exercise callback，dispose，等待可配置 settle window，再比较。
- 一个已知干净 fixture 必须 PASS；一个故意残留且处于声明观察范围内的 fixture 必须 FAIL；未知版本 fixture 必须 UNVERIFIABLE。
- 观察类别按真实能力选择：fiber/state、Cordis-managed listeners/hooks、services/providers、tracked effects/disposables、Cordis timer；每类都有身份稳定性和噪声过滤测试。
- 输出 JSON receipt 和人类可读 Markdown/HTML 摘要；相同输入应确定性输出，时间/随机字段必须隔离或标准化。
- 如果添加 DSH tool/UI，它只能触发隔离审计或展示已完成 receipt，不直接破坏当前 live profile；UI 必须显示覆盖范围和不可证明项。

## 七、工程与对抗测试

- 先建立纯 engine，不把检测逻辑耦合到 React/UI。
- 覆盖同步/异步 disposer、dispose 抛错、悬挂 Promise、重复 dispose、nested fiber、service replace、listener global/local、timer 清理、settle race、目标插件自身启动失败。
- 覆盖 adapter 结构漂移、缺字段、额外字段、版本不匹配、观察器自身资源和并发审计互斥。
- 隔离审计必须有单运行锁；禁止并发 mount 同一个 fixture 造成假残留。
- 所有 timeout 有上限和清晰阶段；只终止本轮精确拥有的子进程，不扫全局 Node/DSH 进程。
- 提供 typecheck、生产 build、bundle/CLI contract、定向测试、完整测试的一键 `verify` 命令。
- 若有浏览器 bundle，必须使用 DSH `window.__ModuleLoader__`，宿主 React/Cordis external，禁止第二份 React。
- README 明确写“验证 Cordis-managed cleanup，不是通用内存泄漏检测器”，并列支持矩阵、限制、隔离模型、退出码、receipt schema 和隐私边界。

## 八、真实运行与截图门禁

按 `$dsh-plugin-real-release-gate` 适配本产品，而不是机械套用 fork graph 字段：

1. Stage 0：预注册支持版本、clean/leaky/unknown 三组预期、隔离目录/profile、端口、超时、允许观察类别和秘密边界。
2. Stage 1：依赖安装、typecheck、build、CLI/bundle contract、完整测试；记录首个真实结果和所有修正。
3. Stage 2：把最终构件安装到隔离 D 盘 DSH profile；验证插件/tool/UI 加载、client asset HTTP 200（如有）、style/disposer、console/page/request error 为 0。
4. Stage 3：在真实 DSH/隔离 runner 中依次执行 clean fixture、leaky fixture、unknown-version fixture；机器 receipt 与 UI/CLI 展示必须一致，退出码准确，卸载 doctor 自身后无残留。
5. 如产品有 Web surface，至少三张本插件真实截图：clean PASS、leak FAIL、unsupported UNVERIFIABLE，并补一个短 GIF。没有 Web surface 时禁止伪造浏览器截图；先向用户说明并根据目标列表规则决定是否需要最小只读 receipt viewer。
6. Stage 4：只用真实证据更新文档、artifact hash、release report 和 PR 准备材料。

## 九、Claude 独立审核

- Codex 完成 engine、fixtures、`npm run verify`、隔离 DSH 门禁和证据后，使用 `$codex-claude-cli-review`。
- Claude 使用 `--safe-mode`，只开放 Read/Glob/Grep；禁止 Bash、Write/Edit、Agent、WebFetch/WebSearch、Codex 或其它模型。
- 每轮使用独立的 `docs/CODEX_TO_CLAUDE_REVIEW_NOTICE_R<N>.md` 和 `docs/CLAUDE_TO_CODEX_REVIEW_RECEIPT_R<N>.md`。
- 审核重点必须包含：覆盖范围是否被夸大、adapter 是否 fail closed、fixture 是否真能区分 clean/leak、观察器自身噪声、timeout/退出码、证据与构件身份。
- 回执唯一末行必须是 `FINAL_DECISION: GO` 或 `FINAL_DECISION: HOLD`；超时/格式错误都不是 GO。
- Claude `GO` 只是技术证据；Codex 必须独立重跑最高信号测试并核对 receipt。

## 十、Git、GitHub、10 commits 与 24 小时 PR 红线

- 可以立即初始化本地 `main` 仓库并开始真实开发提交。
- 如果 GitHub 同名远端不存在，先向用户确认 GitHub owner 和 visibility；未明确前不得自行创建公开仓库，但本地 spike/开发继续。
- 远端获准创建后，记录 GitHub API 的真实 `created_at` 与 `eligible_after = created_at + 24h` 到 `docs/publication-eligibility.md`；不得伪造或回填。
- 产品仓库在 awesome-list PR 前必须至少有 10 个真实、功能性、可审阅提交。禁止空提交、伪造时间或机械拆分同一改动。
- 建议的真实里程碑提交：规则/计划与证据契约；项目/构建脚手架；adapter/支持矩阵；snapshot schema；隔离 runner；clean/leaky fixtures；diff/outcome/退出码；JSON/Markdown receipt；DSH tool/只读 viewer；对抗测试/真实证据/文档。实际提交按完成事实调整。
- 每个提交运行对应最小验证；不强推，不为凑数破坏原子性，不把失败噪声提交当里程碑。
- awesome-list PR 在目标列表 fork/分支中保持聚焦，只改允许的列表项；产品仓 10 个提交不应复制进列表 PR。
- 只有以下全部成立才能创建 PR：GitHub 仓库创建满 24 小时；产品仓真实提交数 ≥10；目标列表最新规则通过；Stage 0 `GO_ENGINE`；Stage 1→3 通过；真实构件/receipt/截图可复核；Claude 最终 `GO`；PR diff 聚焦。
- 条件不足时写 `WAITING_ELIGIBILITY` 或 `FAIL`，禁止提前提必败 PR、自动 merge、强推或绕过规则。

## 十一、执行节奏

- 先完成只读预检、规划文件、CodeGraph Stage 0 和证据预注册，再写 engine。
- 持续推进所有本地可完成工作；GitHub 24 小时等待不是停止开发的理由。
- 每阶段向用户报告已验证事实、下一步和真实阻塞，不把技术困难包装成完成。
- 只有 GitHub owner/visibility、外部 release/PR 等需要新授权的动作才询问；普通实现决策基于源码证据推进。
- 现在开始执行。
