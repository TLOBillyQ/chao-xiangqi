# ADR 0003: 统一对局生命周期与开局闸

## 状态

已采纳，待实现。部分修订 ADR-0002（见“与 ADR-0002 的关系”）。

## 日期

2026-06-20

## 背景

“是否可以做某事”的判定（下称**闸 / gate**）在代码里被同一个词裹了**七件不同的事**，且彼此分歧，已直接产出过 bug：

| # | 概念 | 位置 | 条件 | 驱动 |
| ---: | --- | --- | --- | --- |
| 1 | 全员已准备 | `readyToPlay.ts:34-39` | 在场每人 `玩家状态==1`，**无满员判定** | 摆盘/清场/摆子/`GameStage=2`/PlayerExit/调 init |
| 2 | 满员+已准备 | `turnState.ts:26-31` | `length>=REQUIRED_PLAYERS(2)` 且全员已准备 | `curPlayer`/`isControl`/倒计时/`turnInitialized` |
| 3 | 首回合一次性闸 | `turnInitialized` | 一次性守卫 | init 体只跑一次 |
| 4 | 回合可切换闸 | `canChange` | 切换 2s 窗口内为 false | 守 `gstsServerSwitchTurn` |
| 5 | 当前可操作闸 | `gstsServerCanControl()`+`isControl` | `moveList` 空 + 本方回合 | 真正“此刻能否选子” |
| 6 | 对局生命周期 | `GameStage` | 实际 1=准备/2=进行中/3=空转瞬态 | `variables.ts:8` **误注** `==3` 为进行中 |
| 7 | 冗余触发入口 | — | init 被 `playerReady` 信号(`readyToPlay:49`)**和** 3s 计时器(`ChessInit:30`)各调一次 | — |

**核心缺陷**：#1 与 #2 是“可开局?”的**两套定义**，在“仅 1 人已准备”时分歧——#1 触发（摆子落盘）而 #2 拒绝（不授控制权）。于是出现**“棋盘摆好却一个子都点不动”**：单人试玩以玩家 2（黑方）进入时，`REQUIRED_PLAYERS=2` 挡死首回合初始化，`isControl` 永远为 false，扫描图 `scanPiece.ts:19 (… && isControl)` 永不挂选中。代码注释（`stage.ts:91`、`turnState.ts:13-17`）和回归脚本（`check-turn-state-regression.mjs:31`）都把“单人试玩谁在场谁先手”当作受支持行为，却被 `REQUIRED_PLAYERS=2` 静默架空——而该脚本只用正则核“回退代码还在”，不核“它还可达”，给了假绿。

引擎提供了被忽略的精确信号：`queryGameModeAndPlayerNumber()` 返回 `{ playerCount, playMode: Play(普通/试玩) | RoomPlay(房间) | MatchPlay(对战) }`，足以区分“单人试玩、无对手”与“匹配、应等 2 人”，使单人路径可**永久**修好，无需手动切常量。

## 决策

把上述七件事收敛为**单一对局生命周期状态机**，由新模块 `systems/stage/matchLifecycle.ts` 独家拥有。术语见 `CONTEXT.md`「对局生命周期与回合」。

1. **两轴状态**（取代 #3/#4/#6）：
   - `matchPhase`（关卡实体 float）：`LOBBY`(准备) / `PLAYING`(进行中)。取代 `GameStage` 的 1/2/3 与 `turnInitialized`——“已开局”即 `matchPhase==PLAYING`。
   - `turnPhase`（仅 PLAYING 内有意义）：`ACTIVE` / `HANDOFF`(2s 切换窗口)。取代 `canChange`。

2. **可开局谓词（mode-aware quorum）**（取代 #1/#2 的分歧，修复单人 bug）：
   `可开局 = 全员已准备 AND 在场人数 >= (playMode==Play ? 1 : 2)`，满员门槛由 `queryGameModeAndPlayerNumber().playMode` 决定。**删除 `REQUIRED_PLAYERS` 常量**与手动切换调试流程。

3. **开局原子化**（核心不变量）：`LOBBY→PLAYING` 由 `matchLifecycle.startMatchIfReady()` 一个转换完成——校验可开局后，**原子**跑“摆盘 + 置 `PLAYING` + 授首回合 + 起倒计时”。不存在可被玩法观察到的“已摆子但未授控制权”中间态。`readyToPlay` 降为被调的**摆盘 helper**，`turnState` 降为**切回合 helper**。

4. **单一回合投射 applyTurn()**（取代 #5 的散写）：一个函数据 `(matchPhase, turnPhase, curPlayer)` 统一写 `isControl` + 该阵营 UI 控件组开/关 + 该方倒计时，遍历所有玩家。`isControl` 不再独立置位，而是此投射的产物（扫描图仍按玩家变量读取）。`init` 与 `switchTurn` 里重复的“控制权+UI 组+倒计时”三套写入全部删除，统一走 `applyTurn()`；`playerCreate` 保留 `isControl=false` 作 LOBBY 默认。

5. **事件驱动触发**（取代 #7 双触发）：开局只由 `playerReady` 信号驱动（`readyToPlay`/1849 入口）。**删除 `ChessInit`/1842 的 init 调用**；其 3s 计时器只保留棋子移动检测与昵称同步。`startMatchIfReady()` 以 `matchPhase==LOBBY` 一次性闸保证幂等。

6. **出界播报闸改写**（#6 配套）：`chessDestroy.ts:50` 的 `GameStage != 3` 改为 `matchPhase==PLAYING` 才播报；废除 `GameStage==3` 空转瞬态。顺带消除潜伏的“rematch 清场 32 子时误发 32 条出界播报”（清场时 `matchPhase==LOBBY` → 自然静音）。这是行为修正，非回归，需局内验证。

7. **rematch = PLAYING→LOBBY**：将帅死的“重置再来一局”改为 `matchLifecycle` 的一次回 LOBBY 转换（关倒计时/清 `moveList`/重置剩余棋子），与开局对称。

## 与 ADR-0002 的关系

ADR-0002 为“同 ID 接管”刻意做了 **readyToPlay 管摆盘、turnState 管回合**的分工，并给 `turnState.gstsServerInitializeFirstTurnIfNeeded` **加了一道“已准备闸”**（方案 B）以免抢先起倒计时。本 ADR **保留接管成果**（三张图仍在原 ID、原 slot），但**修订**那道闸的归属与形态：开局判定从 `turnState` 上移到 `matchLifecycle`，由单一 mode-aware 谓词取代“已准备闸 + 满员闸”的双判定。ADR-0002 的迁移结论不变，仅“开局闸放哪、长什么样”被本 ADR 取代。

## 具体规则

- 新模块 `systems/stage/matchLifecycle.ts`，遵守 ADR-0001 依赖方向：`systems` 可依赖 `core/contracts/resources` 及（现存惯例）同层 `systems`；被 `nodes/**` 调用，不反向。`matchPhase`/`turnPhase` 取值常量入 `contracts/`（如 `stage.ts`/`variables.ts`），不散落魔数。
- 不改三张接管图的 `id`/`name`/挂载（1847/1849/1850、1842）。`nodes/**` 仍只注册入口、调 `systems`。
- 删除：`REQUIRED_PLAYERS`（`stage.ts:92`）、`turnInitialized`、`canChange`、`GameStage` 魔数（迁入 `matchPhase`）、`ChessInit` 的 init 调用。`turnState` 的 init/switch 改调 `matchLifecycle`/`applyTurn`。
- `queryGameModeAndPlayerNumber` 按实体方法签名调用（参见 `genshin-ts` 定义），不当 `gsts.f.*` 全局函数。
- 不手改 `src/resources/*`、`dist/`；注入遵守 ADR-0002 工作流（退出地图→注入→重开），单步单 commit。

## 验证

- **探针先行（已完成 2026-06-21）**：曾注入微探针，用「切换视角」dump 在单人试玩与双人下读 `queryGameModeAndPlayerNumber()`。**读数：单人试玩 playerCount==1、双人==2**，唯一未验假设成立。结论：决策 2 的 mode-aware 谓词成立；且 `playerCount` 既已证实可靠（单人 1／双人 2），实现时**优先采用 `quorum = playerCount`（Q3 option B）**——更简洁，连 `playMode` 分支一并省去，彻底删 `REQUIRED_PLAYERS`。注：该探针走弹屏（`gstsServerErrorMsg`）**不落 `Beyond_Debug_Log`**，读数靠局内肉眼；验证后已移除。
- **决策级回归（已落地）**：新建 `scripts/repro-matchstart.mjs`——把 `canStartMatch`/首发选择/`applyTurn`/`switchTurn` 目标逻辑端口为纯 JS，断言 7 场景：单人黑(S1=原 bug 现场，黑方可选子)、单人红(S2)、双人未全准备(S3 不开局)、双人全准备(S4 红先手)、单人但 quorum=2(S5 不开局，mode-aware)、LOBBY/HANDOFF(S6 全锁控)、回合切换目标(S7 含单人留本方)。**升级 `check-turn-state-regression.mjs`**：从“正则核代码存在”（假绿——旧脚本还在找已删的 `InitializeFirstTurnIfNeeded`）改为 16 条静态不变量（旧符号零代码残留 + `isControl` 投射收敛到 applyTurn+3 豁免 + 开局触发唯一 + 摆盘 helper 只被 matchLifecycle 调 + 守门到位）。两脚本并入 `npm run regression`。
- 每张接管图入口写唯一版本戳（`gstsTakeoverReadyToPlay='1849-v2'`、`gstsTakeoverChessDestroy='1850-v1'`、`gstsInjectVerify='2026-06-21-lifecycle-1'`）；关键转换可打 `gstsServerErrorMsg` 探针。
- 局内（终验，待执行）：单人试玩(玩家2)能选子；双人首回合红先手、红走完黑可选；rematch 清场无误报出界。
- **实现 + 对抗审查（已完成 2026-06-21）**：S1–S8 落地（contracts→`matchLifecycle`→`turnState`/接管图→`chessDestroy`→删旧键→回归脚本）。五道验证绿：`typecheck` / `eslint`（改动 8 文件，顺带清 `chessDestroy` 2 处 no-op 断言 + 1 未用 import）/ `regression`（16 不变量 + 7 场景）/ `build`（编译 + 生成 .gia + 注入活地图 `1073741868.gil`，图 1842/1849/1850）。build 中修一处 gsts 类型陷阱：`canStartMatch` 的 `float(playerCount) >= players.length` 触发 `greaterThanOrEqualTo` 泛型不匹配（`get_list_length` 输出 int），改 `int(players.length) >= playerCount`（两边同 int）。随后 5 维度对抗审查（行为保真对照 `git show b4049fa~1:recovered/...` 真值 + 旧版 TS）：**0 确认漂移**，仅 2 个 low 健壮性 nit（`matchPhase` 未初始化方向反转、`playerCount==0` 越界），均经查真值驳回为不可达 non-issue。审查另确认：回合切换 HANDOFF 倒计时双压等价旧版单压、`curPlayer` 仍 2s 后切、L50 闸 `matchPhase==PLAYING` 是决策 5 有意修正清场误报（非回归）。

## 影响

好处：开局判定收敛到单一所有者与单一谓词，#1/#2 永不再分歧；单人试玩**默认可玩**，去掉易忘的手动切常量；`matchPhase`/`turnPhase` 自说明，取代 `GameStage` 魔数 + 两个布尔守卫；播报闸顺带修了清场误报。

代价：触及核心生命周期，爆炸半径大于单点修；`matchLifecycle` 新增一层，需重核被它调用的 `readyToPlay`/`turnState` 行为不漂移；mode-aware 依赖 `queryGameModeAndPlayerNumber` 的试玩语义（已由探针先行去风险）。

## 不做的方案

- **不保留 `REQUIRED_PLAYERS` 手动切常量**：那正是 bug 的陷阱来源（测试路径默认坏）。
- **不做轮询驱动开局**：与“事件驱动”直觉相反，最多延迟 3s。
- **不把回合切换窗压进单一生命周期枚举**（`{LOBBY,PLAYING_ACTIVE,PLAYING_HANDOFF}`）：会把“是否在玩”与“回合相位”耦成一层，查询更绕。两轴更清。
- **不借统一之机改玩法**：仅收敛闸与生命周期；将帅死=重置再来一局等可观察玩法对齐 ADR-0002 原版。

## 回滚

本 ADR 只新增文档，可直接删除回滚。实现时每步为可独立合并的源码改动 + 单图单 commit；某步注入后局内异常，回滚该步即回到 HEAD 级可玩基线，不动其余图、不手改 `dist/`。
