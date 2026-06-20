# ADR 0002: 三张历史节点图的同 ID 接管

## 状态

已采纳，待实现。

## 日期

2026-06-18

## 背景

旧地图里仍有以 `_GSTS_*` 命名、不由当前 `src/` 编译产生的历史节点图。其中三张经局内确认**当前仍在运行**：

| ID | 图 | 挂载实体 | 入口事件 | 职责 |
| ---: | --- | --- | --- | --- |
| 1073741847 | `_GSTS_StagePanel` | **玩家实体** | `界面控件组触发时`（玩家专属） | 准备/对手状态/点赞/规则页/退出结算 |
| 1073741849 | `_GSTS_readyToPlay` | **关卡实体** | `playerReady` 信号（全局） | 全员准备→传送/布局/镜头/摆子/起倒计时 |
| 1073741850 | `_GSTS_chessDestroy` | **关卡实体** | `实体销毁时`（关卡专属） | 销毁后果：计数/出界播报/将帅判胜/全局重置 |

提交 `0bde1c2` 曾试图用 TS 在原 ID 上重写这三张图并注入覆盖，结果**局内逻辑崩溃且 `npm run build` 失败**，`fdb0701` 已干净回退。当前 HEAD 是**已知良好基线**：三张编辑器图与 `src/` 系统分工共存、能正常游玩。

诊断既往失败的根因（均可修，非能力缺口）：

- **构建失败**：忠实移植里把实体方法当全局函数调（如 `gsts.f.setPlayerRankScoreChange(...)`，实际是 `玩家实体.setPlayerRankScoreChange(settlementStatus, scoreChange)`，见 `genshin-ts entity_helpers.d.ts`），以及签名不匹配。
- **运行时崩**：移植里 `while(entities.length>0) removeEntity(...)` 对不缩小的本地快照死循环；跨地图漂移导致镜头/预设点 GUID 对不上（`a8db8b0` 已修过一次镜头 GUID）。

两个决定性的工具/引擎事实约束了正确做法：

- **注入器按 ID 原地替换**（`genshin-ts injector/index.js:58–126`）：同 ID 注入命中 `.gil` 里那张图的 slot 即整体替换（`mode:'replace'`），命中 0 张直接抛错。所以同 ID 接管会**干净替换**编辑器旧版，不叠加；而新 ID 必须先在编辑器建空 slot。
- **挂载决定事件可达性与 `self`**（千星奇域官方文档）：`界面控件组触发时` 只有**玩家实体**图收得到；`实体销毁时` 只在**关卡实体**图触发；信号是全局的；UI/镜头/传送节点靠 `目标玩家` 入参驱动，不要求图挂玩家。构建只换图内容、**不能改 slot 的挂载实体**。

## 决策

**保留"溶解吸收"的原则**（一个职责一个所有者、能复用就调现有 `src/` helper、铲掉别处冗余 call-site），但**机制统一为"同 ID 接管"**：三张图各自用 TS 在**原 ID、原 slot** 上重写。

理由：这三张图的入口事件都受挂载约束（玩家专属 / 关卡专属），它们原来的 slot 就是该事件唯一合法的家——同 ID 接管**挂载天然安全**（复用原 slot 的挂载），无需建新 slot、无需手动删图。这与 chargePower/readyChange/ExitGame 走的"新建 ID + 删旧图"不同，是被挂载约束逼出来的选择。

配套定性：

- **忠实保留当前可观察行为**（迁移，不重设计）。依赖的编辑器资源已不存在的分支视作**死分支，不吸收**——但要逐个核实"资源真没了"。反例：StagePanel 里原 `btn_test`/`1073743813` 的"模拟对手离场"分支**不是死分支**，用户已新增控件 `模拟退出`/`1073744808` 顶替，该分支**保留并改绑新控件**。
- **同 ID 接管 ≠ 1:1 复刻节点**：用地道 TS 忠实重写行为，能复用的调现有 helper（turnState / broadcastUi / rulePageUi / cameraUi / opponentInfoUi），独有的才自己实现；再把别处的重复 call-site 铲掉。
- **结算例外——弃用 src/ 结算、对齐原版 rematch 模型**：`src/systems/settlement/settlement.ts` 是一套新设计（`settled` 一次性保护 + 延迟 `btn_settle→settleStage` 个人结算 + 自动探测掉线/缺席），与原图不符，**整体废弃**。接管图按原图重建结算（将帅死→胜负面板+积分+**重置再来一局**，不 `settleStage`），见逐图处置。`gstsServerSyncOpponentNicknames`（满员互写对方昵称、铭牌功能、非结算）保留并从 settlement.ts 挪出。

逐图处置：

- **chessDestroy(1850)**：接管为专职"销毁后果"图。将帅死按**原版 rematch 模型**自实现——弹胜负面板（切布局 `1073741825` + `准备镜头`）+ `玩家实体.setPlayerRankScoreChange`（积分）+ **重置再来一局**（GameStage 3→1、倒计时关、`moveList` 清、`剩余棋子` 重置），**不 `settleStage`、不调 settlement.ts**；出界播报队列/计数自实现；倒计时/`moveList` 复用 `turnState` helper。**铲掉 `outOfBounds.ts:114-120` 的结算调用**——出界只管"检测→坠落→销毁"，后果交 1850。
- **StagePanel(1847)**：接管为玩家级按钮入口。退出按钮 → 原版 `Settle_Stage` + `ExitGame`；**`模拟退出`/`1073744808`**（顶替已删的 `btn_test`/`1073743813`）→ 对手离场播报 + 积分 + 亮结算按钮（原 Node87/88 分支**保留、改绑新控件**）；调 `rulePageUi`/`broadcastUi` helper；对手状态显示是新增；与 `ControlUISign(1841)`/`rulePageUi` 核对控件 ID 不抢。
- **readyToPlay(1849)**：接管，做摆子/镜头/传送/布局/环境，回合 init 调 `turnState` helper。开局触发**保留"双方点准备"（方案 B）**——给 `turnState.gstsServerInitializeFirstTurnIfNeeded` 的满员自动 init **加一道"已准备"闸**，免得它在点准备前抢先起倒计时。

## 具体规则

- 不改这三张图的 `id`（必须是 1847/1849/1850，否则注入器找不到 slot 或挂载错位）。
- `nodes/**` 只注册 `g.server` 入口，玩法逻辑落 `systems/**`，遵守 ADR 0001 的依赖方向。
- 真值以 `recovered/orphan-nodegraphs/<id>_<name>.readable.txt` 为准，**不**以 `recovered/**/*.ts` 草稿或 `src/` 现有镜像为准。
- 接管前**必须**把该图引用的编辑器资源 ID（镜头/预设点/布局/环境/控件 GUID）跟**当前活地图**核对——地图漂移持续（mapId 已到 `1073741868`）。
- 实体方法（`setPlayerRankScoreChange`、`teleportPlayer`、UI/镜头 helper 等）按 `genshin-ts` 定义的**实体方法/签名**调用，不当 `gsts.f.*` 全局函数。
- 删除 `src/systems/settlement/settlement.ts` 及其 call-sites：`outOfBounds.ts:114-120`、`ChessInit.ts:46-49`（销毁事件自动结算）、ChessInit 计时器里的 `gstsServerSettleIfOpponentAbsent`/`gstsServerRefreshBothJoined`、以及 `btn_settle` 点击处理（`gstsServerConfirmSettle`）。其中 `gstsServerSyncOpponentNicknames` 先挪到非结算模块（如 `opponentInfoUi`）再删。
- 不手改 `src/resources/signals.ts`、`src/resources/prefabs.ts`、`dist/`。

## 接管顺序

爆炸半径升序 + 挂载覆盖：

1. **StagePanel(1847)**：UI 坏不影响开局/对局，反馈最快（进准备界面即见），先验证**玩家实体**接管路。
2. **chessDestroy(1850)**：验证**关卡实体**接管 + 销毁事件 + helper 复用 + 铲 `outOfBounds:114-120`。
3. **readyToPlay(1849)**：放最后——坏了开不了局，又依赖 turnState"已准备"闸、编辑器依赖最多。

每图协议：①核对引用 ID 在当前活地图存在 → ②`typecheck`/`build` 绿 → ③退出地图→注入→重开 → ④局内验证行为 + 铲掉的重复无回归 → ⑤单图单 commit → 下一张。每张都回到"HEAD 级可玩"再继续。

## 验证

- 每张接管图入口写**唯一版本戳**（如 `gstsTakeoverStagePanel='1847-v1'`，仿 `ChessInit.ts:31` 的 `gstsInjectVerify`），关键分支打 `gstsServerErrorMsg` 探针。
- 局内用**「切换视角」键**（`btn_switchCamera`/`1073744024`，当前入口 `ControlUISign.ts:45`）dump 版本戳+关键状态；旧编辑器版不会写新戳，读到即证明 TS 接管生效。（`btn_test`/`1073743813` 已从游戏侧删除，不再用。）
- 注入后**不要在编辑器里重开存盘**（会 clobber 注入，见既有工作流）。

## 影响

好处：

- 三张仍生效的历史逻辑进入版本控制与 TS 管理；每个职责收敛到单一所有者，消除"重复但错误的镜像"。
- 同 ID 接管挂载天然安全，且原地替换后**没有要手动删的编辑器图**，比"新建+删旧"更省事、更少手抖空间。

代价：

- 接管图替换的是整张图，TS 必须忠实覆盖该图行为；移植仍需细致，且每图都要按当前活地图重新核对 GUID。
- 依赖注入工作流纪律（退出→注入→重开），否则编辑器存盘会还原。
- **结算行为回到原版**（用户已确认）：将帅死 = 重置再来一局（关卡仅由退出按钮 `Settle_Stage` 结束），不再走"弹结算面板→点 `btn_settle`→个人结算"；**不再自动探测真实掉线/缺席**，真有人中途退由留下方按 `模拟退出` 手动触发。这是"对齐原版"，不是新玩法设计。

## 不做的方案

- **不做新建 ID + 删旧图**（chargePower 路子）：这三张图入口事件受挂载约束，原 slot 是唯一合法的家，新建 slot 反而要手动配挂载、易错。
- **不做一次动三张**：`0bde1c2` 就是这么崩的且查不清哪坏。逐图、单 commit、局内验证。
- **不借接管之机改玩法**：迁移与玩法改动分开，先忠实保留可观察行为。
- **不依赖挂载审计工具判定是否在跑**：工具证不了挂载，真值靠局内探针/观察。

## 回滚

本 ADR 只新增文档，可直接删除回滚。

实现时每张图是独立 commit：某张接管后局内异常，回滚该图 commit 即回到 HEAD 级可玩基线，不动其余两张、不手改 `dist/`、不动编辑器其他资源。
