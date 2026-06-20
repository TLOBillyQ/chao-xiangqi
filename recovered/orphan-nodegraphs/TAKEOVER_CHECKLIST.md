# 三张历史图同 ID 接管 · 逐图执行清单

决策与依据见 `docs/adr/0002-historical-graph-same-id-takeover.md`。真值以同目录 `<id>_<name>.readable.txt` 为准。

**通用每图协议**：①核对引用 ID 在当前活地图存在（mapId 持续漂移，现 `1073741868`）→ ②`npm run typecheck` + `npm run build` 绿 → ③退出地图→注入→重开 → ④局内验证行为 + 铲掉的重复无回归 → ⑤单图单 commit → 下一张。每张回到 HEAD 级可玩再继续。

**验证探针**：每图入口写唯一版本戳（仿 `ChessInit.ts:31` 的 `gstsInjectVerify`），关键分支打 `gstsServerErrorMsg`。局内按**「切换视角」**（`btn_switchCamera`/`1073744024`，入口 `ControlUISign.ts:45`）dump。`btn_test`/`1073743813` 已删，勿用。

---

## ① StagePanel(1073741847) — 玩家实体 · `界面控件组触发时`（玩家专属）

**✅ 已实现 · typecheck + `--noinject` 编译绿（待局内注入验证）**
- 新增 `src/nodes/ui/StagePanelGraph.ts`（入口：1 个 `界面控件组触发` + 3 个 `onSignal` 接收 showLike/chgPlayerStage/ExitGame）+ `src/systems/ui/stagePanelUi.ts`（玩法 helper）。
- `editorIds.ts` 增 `btn_simulateExit/1073744808`、`ui_rulePage/937`、`likeAnimControls(691/695/699/703/707/711)`、`str_opponentExited`；`variables.ts` 增 `玩家状态/未准备/对方玩家状态/CurScore`。
- 计时器：直接写 `setTimeout`，编译器自动生成 `__gsts_timeout_*` 池（点赞收起 2s、播报收起 3s），未手抄字典机器。
- **btn_settle 冲突已消除**：从 `ControlUISign.ts` changeDir(1844) 删 `gstsServerConfirmSettle()` 分支 + 其 import；settle 职责整体归 1847（`Settle_Stage`+`ExitGame`，对齐原版）。1844 仍管 btn_viewRules/btn_Ready/reGame 的相机/标题（与 1847 互补，非冲突）。
- **待局内核对的 ID（readable 提取，未对活地图核对）**：点赞动效池 `1073742691-711`、规则页 `1073742934/937`。若不可见即属死分支可丢。
- **偏差/存疑**：模拟退出加分用 `SettlementStatus.Victory`（原 readable Node101 字面量 `4100` 疑为该枚举内部编码，局内确认积分是否 +5 生效）。

- **复用 helper**：`rulePageUi`（规则页）、`broadcastUi`（ErrorMsg 播报）。**不复用 settlement**（已废，见 ④）。
- **原版结算分支（保留）**：退出按钮 → `Settle_Stage` + 发 `ExitGame` 信号；**`模拟退出`/`1073744808`**（顶替已删 `btn_test`/`1073743813`）→ 对手离场播报（"你的对手离开了游戏…" + `__gsts_timeout_6` 轮播 + conplayer 字典）+ 积分 `setPlayerRankScoreChange` + 亮结算按钮 `1073743811`。即原 Node87/88 分支**保留，把比较常量 `1073743813` 改成 `1073744808`**。
- **新增（src/ 无）**：对手状态显示——`chgPlayerStage` 信号 → `对方玩家状态` 文案（准备好了/查看规则/闲逛随机）。
- **铲/核对重复**：与 `ControlUISign(1841)`/`rulePageUi` **核对控件不抢**。重点 landmine：StagePanel 旧图把 `1073742690` 当"准备/重开"，但当前 `editorIds` 里 `1073742690` = `btn_reGame`，`ControlUISign.ts:42` 已占用——**接管前先确认当前准备按钮的真实控件 ID**，别复活 readyChange 那套语义污染。
- **死分支核对**：依赖控件（点赞 `1073742674`、规则 `1073742518/875`、退出 `1073742675`）接管前逐个核对是否仍在当前布局可见，不可见即按死分支丢。
- **验证点**：进准备界面点"准备"→对方状态文案刷新；点赞/规则/退出按预期；按 **模拟退出** → 对手离场播报 + 亮结算按钮；版本戳 dump 到 `1847-v1`。

## ② chessDestroy(1073741850) — 关卡实体 · `实体销毁时`（关卡专属）

- **复用 helper**：`turnState`（倒计时关 / `moveList` 清）；**不复用 settlement**（已废，见 ④），将帅后果按原版自实现。
- **将帅死 = 原版 rematch（自实现、不 `settleStage`）**：弹胜负面板（切布局 `1073741825` + `准备镜头`）+ 积分 `实体.setPlayerRankScoreChange(...)`（按 readable Node125/150/173 的红黑分值）+ **重置再来一局**（`GameStage` 3→1、红黑倒计时置 `-999` 关、`moveList` 清、双方 `剩余棋子` 重置）。
- **独有自实现**：出界播报队列（`播报-出界阵营/棋子/剩余`、`出界播报玩家昵称`、`__gsts_timeout_0_*` 轮播）、`剩余棋子` 计数。
- **必铲重复**：删 `outOfBounds.ts:114-120` 的结算调用（出界只保留"检测→坠落→销毁"，将帅后果统一由 1850 做）；并随 `settlement.ts` 整体删除（见 ④）。
- **引用 ID 核对**：控件 `1073742720/676/690/675/674`、`1073742852-856`、`1073742864`、`1073742471`、布局 `1073741825`；环境 `1186988036/1186988035`；`准备镜头` 锚 `1077936985`。
- **验证点**：吃将/帅→胜负面板+积分+倒计时关+`moveList` 清+`剩余棋子` 重置 + **棋盘重摆继续打（不结算关卡）**；出界播报正常；版本戳 `1850-v1`。

## ③ readyToPlay(1073741849) — 关卡实体 · `playerReady` 信号（全局）· **放最后**

- **开局触发 = 方案 B（双方点准备）**：保留"全员 `玩家状态==1` 才开局"。
- **复用 helper**：`turnState.gstsServerInitializeFirstTurnIfNeeded`（回合 init / 红黑先手 / 倒计时）；摆子坐标用 `contracts/stage.ts` 的 `initPos`。
- **独有自实现**：传送预设点、切游玩布局、设双方镜头、`剩余棋子=16`、环境、起 `红方倒计时`、**摆 16+16 棋子（唯一来源，不可丢）**、`GameStage=2`、起 `PlayerExit`。
- **必改重复（B 的闸）**：给 `turnState.gstsServerInitializeFirstTurnIfNeeded` 加"已准备"门槛——满员但未全员准备时**不**自动起回合，免得在点准备前抢先起倒计时（消除 1849↔turnState 双初始化）。
- **引用 ID 核对（漂移高危）**：镜头 GUID 在 readable 里是 `1077936136-145`，而 `0bde1c2` 用的是 `1077937005/1077937007`——**必须对当前活地图重新确认镜头/预设点 GUID**（`a8db8b0` 已栽过一次）；布局 `1073742453`、控件 `1073742475/871/471`、预设点 `1073741826`、环境 `1186988035`。
- **landmine**：`0bde1c2` 的 `while(entities.length>0) removeEntity(...)` 死循环——清场用倒序索引或一次取一次删的安全写法。
- **验证点**：满员后双方点准备→摆子+镜头+布局+倒计时一次到位、不重复起倒计时；版本戳 `1849-v1`。

## ④ 删除 src/ 结算（贯穿三图，对齐原版 rematch）

`src/systems/settlement/settlement.ts` 整套新设计废弃（`settled` 一次性保护 + 延迟 `btn_settle→settleStage` 个人结算 + 自动探测掉线/缺席），结算由接管图按原版重建。删除步骤：

- 先把 `gstsServerSyncOpponentNicknames`（满员互写对方昵称、铭牌功能、非结算）从 settlement.ts 挪到非结算模块（如 `opponentInfoUi`），别误删。
- 删 `gstsServerSettleGame` / `gstsServerConfirmSettle` / `gstsServerSettleIfOpponentAbsent` / `gstsServerSettleIfPlayerLeft` / `gstsServerRefreshBothJoined`（`bothJoined` 若仍被昵称同步用则随之搬迁）。
- 清 call-sites：`outOfBounds.ts:114-120`、`ChessInit.ts:46-49`（销毁事件自动结算入口）、ChessInit 计时器里的缺席结算/`gstsServerRefreshBothJoined` 调用、`btn_settle` 点击处理。
- **行为变化（已确认）**：将帅死 = 重置再来一局（关卡仅由退出按钮 `Settle_Stage` 结束）；不再自动探测真实掉线/缺席，靠 `模拟退出`/`1073744808` 手动触发。

---

## 备注

- `recovered/orphan-nodegraphs/README.md` 的"迁移状态"表声称三张已接管注入——那是 `0bde1c2` 时写的，**现已回退、不属实**，按本清单为准（README 待更正）。
- chargePower(1826)/readyChange(1846)/ExitGame(1848) 维持原结论：不接管，已从编辑器删除，仅审计存档。
