# .gil 历史节点图：审计与同 ID 迁移清单

本目录保存从当前地图 `.gil` 中额外存在的 `_GSTS_*` 服务器节点图提取产物。最初被当作「孤儿图」审计（恢复出的 TypeScript 在 `src/recovered/orphanNodegraphs/`，仅作 `tsconfig` 类型检查档案，不注册 `g.server`）。

**结论已修正**：经查这些图**并非全是孤儿**——其中 `1847/1849/1850` 经用户游戏内确认**当前仍在运行**。因此处置策略由「审计后编辑器清理」改为「按原 ID 用 TS 重新实现并注入覆盖（同 ID 接管）」：旧图仍挂载在 `.gil` 上，新 ID 会与之叠加，故必须同 ID 覆盖。运行代码进入 `src/nodes|systems|contracts`，`src/recovered/*` 继续只作审计档案、不被运行逻辑 import。

- 提取来源：`C:/Users/Lzx_8/AppData/LocalLow/miHoYo/原神/BeyondLocal/342478178/Beyond_Local_Save_Level/1073741865.gil`（当前注入地图 mapId=1073741865）
- 提取时间：2026-06-17 Asia/Shanghai
- 提取脚本：`scripts/extract-orphan-nodegraphs.mjs`
- 挂载审计脚本：`scripts/audit-nodegraph-mounts.mjs`

## 挂载审计的局限（重要）

`audit-nodegraph-mounts.mjs` 的 `isStrongMountEvidence()` 恒返回 `false`（`.gil` 挂载 schema 未确证），故**永远不会输出 `mounted`**，最多给 `ambiguous`/`likely-unmounted`，且会把已知在跑的 in-src 图（如 BeginCharge/ControlUI）误判为 `likely-unmounted`。**mountStatus 列两个方向都不可作运行时真值**。是否仍在运行只能靠游戏内观察或探针确认——本清单的「仍挂载」依据来自用户游戏内确认，而非审计工具。

## 迁移状态（截至 2026-06-17）

用户已确认 `chargePower`、`readyChange`、`ExitGame` 已从编辑器删除；剩余仍实际挂载生效的历史图为 `StagePanel(1847)`、`readyToPlay(1849)`、`chessDestroy(1850)`。

> **状态更正（2026-06-18）**：`0bde1c2` 曾尝试同 ID TS 接管这三张图，结果**局内崩溃且 `npm run build` 失败**，`fdb0701` 已**干净回退**。下表原先标注的"✅ 已实现、构建并注入"**不属实**。当前 HEAD 是三张编辑器图与 `src/` 分工共存的已知良好基线。重做策略与逐图执行清单见 `docs/adr/0002-historical-graph-same-id-takeover.md` 与同目录 `TAKEOVER_CHECKLIST.md`。

| ID | 图 | 处置 | 进度 |
| ---: | --- | --- | --- |
| 1073741849 | `readyToPlay` | 同 ID TS 接管（开局，触发=方案B 双方准备） | ⏳ 待重做（接管放最后，见 CHECKLIST ③） |
| 1073741847 | `StagePanel` | 同 ID TS 接管（准备/UI/信号） | ⏳ 待重做（先接管，见 CHECKLIST ①） |
| 1073741850 | `chessDestroy` | 同 ID TS 接管（销毁后果） | ⏳ 待重做（见 CHECKLIST ②，含铲 `outOfBounds:114-120`） |
| 1073741826 | `chargePower` | 不接管，审计存档 | 已被 `nodes/charge/*` 覆盖，且用户确认编辑器侧已删除 |
| 1073741846 | `readyChange` | 不接管（把 `btn_reGame` 当准备切换，语义污染） | 审计存档，用户确认编辑器侧已删除 |
| 1073741848 | `ExitGame` | 不接管（裸 `settleStage`） | 审计存档，用户确认编辑器侧已删除；退出按钮走现有结算入口 |

**当前策略**：注入器按 ID 原地替换 `.gil` 里已存在的图 slot。三张图均走同 ID 接管（复用原 slot，挂载天然安全，无需手动删图）；`recovered/*` 继续只作审计档案、不被运行逻辑 import。

> 注：下方「深入审计结论」是最初按「孤儿/可能未挂载」假设写的历史结论，凡涉及「确认无用后清理」「未挂载」的判断，均以上方修正结论与游戏内确认为准。

## 重新提取

```bash
node scripts/extract-orphan-nodegraphs.mjs ^
  --gil "C:/Users/Lzx_8/AppData/LocalLow/miHoYo/原神/BeyondLocal/342478178/Beyond_Local_Save_Level/1073741865.gil" ^
  --out recovered/orphan-nodegraphs ^
  --ids 1073741826,1073741846,1073741847,1073741848,1073741849,1073741850
```

PowerShell 可把 `^` 换成反引号。

## 清单与建议

|         ID | .gil 名称            | 审计草稿                                         | 当前建议                                                                   |
| ---------: | -------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 1073741826 | `_GSTS_chargePower`  | `src/recovered/orphanNodegraphs/chargePower.ts`  | 当前 `src/nodes/charge/*` 已接管蓄力链路，保留审计，后续可清理孤儿图       |
| 1073741846 | `_GSTS_readyChange`  | `src/recovered/orphanNodegraphs/readyChange.ts`  | 旧逻辑把 `btn_reGame` 当准备切换，不应直接恢复；仅审计                     |
| 1073741847 | `_GSTS_StagePanel`   | `src/recovered/orphanNodegraphs/StagePanel.ts`   | 当前 UI 已拆到 `systems/ui/*`；只在发现规则页/对手状态提示缺口时小范围迁移 |
| 1073741848 | `_GSTS_ExitGame`     | `src/recovered/orphanNodegraphs/ExitGame.ts`     | 可迁移到 `ControlUISign.ts` 的现有 UI 事件分支，但默认不恢复旧图           |
| 1073741849 | `_GSTS_readyToPlay`  | `src/recovered/orphanNodegraphs/readyToPlay.ts`  | 当前 `ChessInit`、`turnState` 和编辑器摆放承担开局；旧开局图仅审计         |
| 1073741850 | `_GSTS_chessDestroy` | `src/recovered/orphanNodegraphs/chessDestroy.ts` | 重点审计将/帅销毁判胜、出界播报、`moveList` 清理是否已被当前系统覆盖       |

## 产物说明

每个孤儿图都有三类机器产物：

- `*.json`：直接从 `.gil` NodeGraph protobuf 解码出的结构。
- `*.gia`：把同一 NodeGraph 包回标准 GIA Root 容器，便于独立检查。
- `*.readable.txt`：面向审计的文本摘要，包含节点模板、字面量、连线、控制流边和提取出的 ID / 字符串。

`src/recovered/orphanNodegraphs/*.ts` 用当前项目的常量和模块命名方式描述旧行为，但故意不使用 `g.server(...)`。若要恢复某个行为，应迁移到当前 `src/systems/*` 或现有入口，而不是复活这些孤儿节点图。

## 深入审计结论

### 总体判断

这 6 个图都是当前 `src/` 编译入口外的 `.gil` 历史节点图。它们仍保存在地图文件中，但不再由当前 TypeScript 源码维护，因此不应作为运行时事实源。

当前最合理的处置策略是：

- 已被当前系统覆盖的旧图：审计确认后，从编辑器侧清理孤儿节点图。
- 仍有价值的旧行为：迁移到现有 `src/nodes/*` 或 `src/systems/*` 模块，而不是复活旧 `_GSTS_*` 图。
- 依赖 UI、全局计时器、预制体、布局的部分：明确标为编辑器边界，不从代码假设其一定存在或仍可见。

### 按图结论

| 图                   | 结论                                                                                                                                                                        | 处置                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `_GSTS_chargePower`  | 已由当前 `BeginCharge` / `ChargeChangeTick` / `StopCharge` / `ResetCharge` 接管；当前实现还包含落点预览和红黑方向预制体区分。                                               | 不迁移，审计后可清理。                                                              |
| `_GSTS_readyChange`  | 旧图把 `1073742690` 当“未准备”切换，但当前该 ID 是 `btn_reGame`；直接恢复会污染“再来一局/切垂直视角”语义。                                                                  | 不迁移；如需要准备系统，应新建 `readyUi`，绑定 `btn_Ready` 而非 `btn_reGame`。      |
| `_GSTS_StagePanel`   | 部分被覆盖：规则页标题隐藏/恢复、通用播报 UI、玩家离场结算。未完整覆盖：对手状态文案、局内规则按钮、点赞/退出提示、旧 `playerReady/chgPlayerStage` 链路。                   | 拆分审计；只迁移确认为当前产品需要的子功能。                                        |
| `_GSTS_ExitGame`     | 当前正式 UI 只接 `btn_settle`；旧 `btn_exitGame -> settleStage` 未接入。                                                                                                    | 若编辑器仍显示 `btn_exitGame`，迁移为当前结算系统入口，不直接调用裸 `settleStage`。 |
| `_GSTS_readyToPlay`  | 回合初始化、倒计时、`moveList` 初始化已由 `ChessInit` + `turnState` 接管；但旧图“创建/摆放开局棋子”当前没有代码等价实现，依赖编辑器预摆放或未接入的 `stage.ts initPos` 表。 | 不恢复旧图；把开局棋子来源明确标为编辑器边界。                                      |
| `_GSTS_chessDestroy` | 将/帅出界后判胜已由 `outOfBounds.ts -> settlement.ts` 覆盖；玩家离场/缺席也有当前结算路径。未覆盖旧出界播报队列和任意销毁事件判胜。                                         | 保留“出界播报 UI”和“非出界销毁将帅”的审计项。                                       |

### 当前源码覆盖矩阵

- 蓄力链路：已覆盖。
  - 当前入口：`src/nodes/charge/*`
  - 当前系统：`src/systems/piece/launch.ts`、`src/systems/charge/landingPreview.ts`
  - 结论：旧 `_GSTS_chargePower` 可作为历史图清理。

- 回合与倒计时：基本覆盖。
  - 当前入口：`src/nodes/stage/ChessInit.ts`
  - 当前系统：`src/systems/turn/turnState.ts`
  - 覆盖：`curPlayer`、`canChange`、`isControl`、红黑倒计时、`moveList` 停稳后切回合。

- 结算：核心覆盖。
  - 当前系统：`src/systems/settlement/settlement.ts`
  - 覆盖：一次性结算保护、胜负面板、`btn_settle`、玩家离场、对手缺席。
  - 迁移原则：新增结算入口也应进入这套 `settled` / `redWin` / `btn_settle` 体系。

- 将/帅被吃判胜：出界路径已覆盖。
  - 当前系统：`src/systems/motion/outOfBounds.ts`
  - 当前证据覆盖“出界导致销毁”场景：棋子出界后延迟销毁，若棋子类型是 `帅` 或 `将`，再调用当前结算系统。
  - 限定：如果后续存在其他机制直接销毁将/帅，不经过 `outOfBounds.ts`，需要另补统一判胜入口。

- UI 状态：部分覆盖。
  - 已覆盖：开局规则页隐藏/恢复、通用播报、准备按钮切垂直镜头。
  - 未覆盖或未确认：对手随机状态、`btn_viewRulesInGame`、点赞、旧退出提示、出界播报列表。

### 需要人工确认的编辑器边界

这些结论无法仅靠 TypeScript 源码证明，需要在编辑器或局内验证：

- 开局棋子是否已经在编辑器中预摆放。当前源码没有使用 `stage.ts` 的 `initPos` 表批量创建开局棋子。
- `btn_exitGame`、`btn_showLike`、`btn_viewRulesInGame` 是否仍在当前运行布局中可见。
- 出界播报列表控件 `id_broadList` 是否仍需要展示。
- 全局计时器 `红方倒计时` / `黑方倒计时` 已按当前代码使用；旧图里的 `CheckChessMovestage` 是普通计时器名，当前仍由 `ChessInit` 使用。
- `Signal.chgPlayerStage` 当前仍由 `playerCreate.ts` 周期发送，但 `src` 中没有接收者；需要确认是否还有编辑器侧消费，否则它是清理候选。

### 建议迁移/清理顺序

1. **先清理/确认无用**
   - `_GSTS_chargePower`
   - `_GSTS_readyChange`
   - `_GSTS_readyToPlay` 的旧自动摆子逻辑，前提是确认编辑器预摆放成立

2. **低风险可迁移**
   - `btn_exitGame`：如当前 UI 仍暴露该按钮，把它接到当前 `gstsServerConfirmSettle()` 或当前结算流程的安全入口；不要恢复旧裸 `settleStage` 图。

3. **需要产品判断后再迁移**
   - 准备状态系统：如果目标是“双方点准备才开局”，应新增当前架构下的 ready state，而不是恢复 `未准备 + btn_reGame`。
   - 对手状态提示/随机文案：如果仍需要，再纳入 `systems/ui`。
   - 出界播报队列：如果仍需要，再纳入 `systems/ui/broadcastUi.ts`，复用当前播报控件。

4. **重点风险复核**
   - 将/帅非出界销毁是否可能发生；如果可能，需要在当前结算系统加统一入口。
   - `moveList` 在出界销毁后的清理是否总能靠移动停止检测收敛；如存在被销毁实体仍留在列表的场景，需要补清理。

### 不建议恢复的旧行为

- 不恢复 `_GSTS_readyChange`，因为它把 `btn_reGame` 当准备状态按钮。
- 不恢复旧 `_GSTS_readyToPlay` 批量创建棋子，除非决定放弃编辑器预摆放并重新设计开局生成。
- 不恢复旧 `_GSTS_ExitGame` 的裸 `settleStage` 调用；当前结算应统一走 `settled` / `redWin` / `btn_settle` 体系。
- 不手改 `src/resources/signals.ts` 或 `src/resources/prefabs.ts`；它们是构建期自动生成产物。
