# 架构与依赖关系（超象棋：弹射）

本文描述 `src/` 的分层、职责与依赖方向。目标是让节点图入口只负责接收引擎事件，玩法规则沉到系统层，编辑器契约集中管理。

## 分层模型

依赖方向只能自上而下调用下层，禁止反向依赖：

```text
L3 nodes/                 注册 g.server 的引擎入口
        ↓
L2 systems/               玩法系统：ui / turn / piece / charge / motion / settlement / scan
        ↓
L1 core/                  通用 helper：向量、碰撞物理
        ↓
L0 contracts/ resources/  编辑器契约、资源生成文件、常量与关卡实体访问
```

旧入口文件 `Global.ts`、`Tool.ts`、`UIControlGroupId.ts`、`ChangeControl.ts`、`chessEntity/chessObjFunction.ts`、`chargePower/chargeFunction.ts`、`trigger/triggerFunction.ts`、`settlement/settleFunction.ts` 目前保留为兼容 re-export，便于外部引用逐步迁移；新增代码应直接 import `contracts/`、`core/`、`systems/`。

## 目录职责

| 目录 / 文件 | 层 | 职责 |
| --- | --- | --- |
| `src/contracts/editorIds.ts` | L0 | 阵营、标签、预制体、UI 控件组等编辑器 ID 契约 |
| `src/contracts/stage.ts` | L0 | 棋盘边界、初始棋子坐标、关卡实体 `getServerStageEntity()` |
| `src/contracts/timers.ts` | L0 | 普通定时器名、全局倒计时名、倒计时 UI 控件 ID |
| `src/contracts/physics.ts` | L0 | 半径、恢复系数、阻尼、落点校准等物理常量 |
| `src/contracts/variables.ts` | L0 | 跨图共享实体变量名约定 |
| `src/contracts/graphIds.ts` | L0 | 节点图 `id` / `name` 契约备查 |
| `src/resources/signals.ts` | L0 | 自动生成的信号定义；不要手改 |
| `src/resources/prefabs.ts` | L0 | 自动生成的预制体清单；不要手改 |
| `src/core/vector.ts` | L1 | 逻辑向量/世界向量转换、反射向量 |
| `src/core/physics.ts` | L1 | 碰撞冲量、真实碰撞点计算 |
| `src/systems/ui/*` | L2 | 方向/蓄力 UI、播报 UI、规则页显隐、相机切换 |
| `src/systems/turn/turnState.ts` | L2 | `moveList`、可操控判定、回合切换 |
| `src/systems/piece/directions.ts` | L2 | 红黑双方棋子方向字典 |
| `src/systems/piece/launch.ts` | L2 | 选定方向后发射棋子 |
| `src/systems/charge/landingPreview.ts` | L2 | 蓄力落点预览、落点指示生成/销毁/对账 |
| `src/systems/motion/movement.ts` | L2 | 速度阻尼衰减与运动停止清理 |
| `src/systems/motion/outOfBounds.ts` | L2 | 棋子出界、下落表现、将帅出界触发结算 |
| `src/systems/settlement/settlement.ts` | L2 | 结算 UI、确认结算、玩家离场/缺席结算 |
| `src/systems/scan/scanPiece.ts` | L2 | 扫描玩家脚下可选棋子、维护选中特效 |
| `src/nodes/**` | L3 | 仅注册 `g.server`，把事件/信号/计时器分发到 systems |

## 节点入口

`g.server(...)` 入口统一位于 `src/nodes/`：

- `nodes/stage/ChessInit.ts`：关卡初始化、静止扫描、玩家缺席/离场结算。
- `nodes/motion/triggerNode.ts`：碰撞事件、运动计时器分发。
- `nodes/piece/chessObjNode.ts`：棋子初始化、墙壁反弹。
- `nodes/charge/{BeginCharge,StopCharge,ChargeChangeTick,ResetCharge}.ts`：蓄力生命周期。
- `nodes/player/{playerCreate,playerActive,playerTimers,ControlUISign}.ts`：玩家创建、选子、倒计时、UI 输入。
- `nodes/scan/newGetChess.ts`：扫描图入口。

入口文件不得被其他模块 import；除 `genshin-ts` 外，只应依赖 `contracts/`、`resources/`、`core/`、`systems/`。

## 关键运行链路

### 选子 → 蓄力 → 发射

1. `nodes/scan/newGetChess.ts` 定时调用 `systems/scan/scanPiece.ts`，维护玩家 `ScanEntity`。
2. `nodes/player/playerActive.ts` 收到 `Signal.GetPiece` 后调用：
   - `systems/piece/directions.ts` 取得方向字典；
   - `core/vector.ts` 完成方向转换；
   - `systems/ui/directionUi.ts` 激活方向/蓄力 UI。
3. `nodes/charge/BeginCharge.ts` 开始蓄力并显示蓄力 UI。
4. `nodes/charge/ChargeChangeTick.ts` 调用 `systems/charge/landingPreview.ts` 预测落点并维护落点指示。
5. `nodes/charge/StopCharge.ts` 调用 `systems/piece/launch.ts` 发射棋子并清理方向实体/落点指示。

### 运动 → 碰撞 → 回合切换

1. `nodes/motion/triggerNode.ts` 收到碰撞事件。
2. 炮的首次碰撞加速仍在入口中保留；普通碰撞调用 `core/physics.ts` 计算冲量。
3. 运动计时器调用 `systems/motion/movement.ts` 做速度衰减。
4. `systems/turn/turnState.ts` 维护 `moveList`，所有棋子静止后切换回合。

### 出界 → 结算

1. `nodes/motion/triggerNode.ts` 的 `OutCheck` 计时器调用 `systems/motion/outOfBounds.ts`。
2. 普通棋子出界播放下落并销毁。
3. 将/帅出界后调用 `systems/settlement/settlement.ts` 显示胜负 UI。
4. 玩家点击「结算」按钮时，由 `nodes/player/ControlUISign.ts` 调用 `gstsServerConfirmSettle()` 真正 `settleStage()`。

## 模块间通信方式

1. **信号**：入口之间通过 `send(Signal.X)` / `onSignal` 通信；信号定义在 `resources/signals.ts`，由构建工具提取，禁止手工编辑。
2. **实体变量**：stage / 玩家 / 棋子实体上的自定义变量是跨图状态源，例如 `moveList`、`curPlayer`、`canChange`、`settled`、`ischarge`、`ScanEntity`。
3. **定时器**：普通定时器和全局倒计时名称集中在 `contracts/timers.ts`；编辑器侧必须存在对应全局计时器。
4. **编辑器 ID**：UI、预制体、标签、阵营 ID 集中在 `contracts/editorIds.ts`；ID 变更必须同步编辑器资源。

## 改动注意事项

- 不手改 `dist/` 产物；需要验证时删除整个 `dist/` 后重新构建。
- 不手改 `src/resources/signals.ts`、`src/resources/prefabs.ts`。
- 不随意修改已注入节点图的 `g.server({ id, name })`；`name` 是编辑器契约。
- 新增玩法逻辑优先放入 `systems/**`；只有事件注册和参数分发留在 `nodes/**`。
- 新增通用数学/物理 helper 放入 `core/**`，不能依赖 systems 或 nodes。
- 新增编辑器 ID/定时器/关卡契约放入 `contracts/**`。
