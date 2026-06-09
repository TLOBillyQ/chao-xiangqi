# 架构与依赖关系（超象棋：弹射）

本文描述 `src/` 各模块的分层、职责与相互依赖，便于定位「改一处会影响哪里」。
依赖关系来自模块间 `import`（不含 `genshin-ts` 引擎与 `self`/`player()` 等全局）。

## 分层模型

代码按依赖方向自底向上分四层：底层不依赖上层，节点入口层（注册 `g.server`）位于最顶端。

```
L3 节点入口层（注册 g.server，被引擎按事件/信号调用，互不 import）
   ChessInit · trigger/triggerNode · chessEntity/chessObjNode
   chargePower/node/{BeginCharge,StopCharge,ChargeChangeTick,ResetCharge}
   playerEntity/node/{playerCreate,playerActive,ControlUISign,playerTimers}
        │
        ▼ 调用
L2 领域逻辑层（纯函数，承载规则）
   ChangeControl · chessEntity/chessObjFunction · trigger/triggerFunction
        │
        ▼ 调用
L1 工具 / 适配层
   Tool · UIControl/ControlUIFunc · settlement/settleFunction
        │
        ▼ 引用
L0 资源 / 常量层（无内部依赖）
   Global · UIControlGroupId · resources/signals · resources/prefabs
```

## 模块依赖表

| 模块                                   | 层  | 依赖（内部 import）                                                                      | 职责                                                                                                              |
| -------------------------------------- | --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Global.ts`                            | L0  | —（仅引擎）                                                                              | 阵营、物理常量、初始坐标、墙壁边界、标签 / 定时器 / 预制 ID、方向字典、`getServerStageEntity()`                   |
| `UIControlGroupId.ts`                  | L0  | —                                                                                        | UI 控件组 ID（方向、蓄力、按钮、播报）                                                                            |
| `resources/signals.ts`                 | L0  | —                                                                                        | 信号定义（`defineSignal`）                                                                                        |
| `resources/prefabs.ts`                 | L0  | —                                                                                        | 预制体 ID 清单                                                                                                    |
| `Tool.ts`                              | L1  | `Global`                                                                                 | 向量数学、碰撞冲量 `gstsServerCalculateImpulse`、反射 `gstsServerCalculateReflectVector`、真实碰撞点、错误提示 UI |
| `UIControl/ControlUIFunc.ts`           | L1  | `UIControlGroupId`                                                                       | 方向 / 蓄力 UI 的显隐与激活                                                                                       |
| `settlement/settleFunction.ts`         | L1  | `Global`                                                                                 | 整局结算 `gstsServerSettleGame`（settled 一次性保护）、退出检测 `gstsServerSettleIfPlayerLeft`                    |
| `ChangeControl.ts`                     | L2  | `Global`, `Tool`                                                                         | `moveList` 维护、可操控判定、回合切换 `gstsServerSwitchTurn`                                                      |
| `chessEntity/chessObjFunction.ts`      | L2  | `ChangeControl`, `Global`, `Tool`                                                        | 发射棋子 `gstsServerConfirmAndMovePiece`                                                                          |
| `trigger/triggerFunction.ts`           | L2  | `Global`, `settlement/settleFunction`                                                    | 速度插值 `gstsServerMoveChangeTick`、出界处理 `gstsServerOutCheck`                                                |
| `ChessInit.ts`                         | L3  | `ChangeControl`, `settlement/settleFunction`                                             | 关卡图 `1073741842`：初始化、静止扫描、退出结算                                                                   |
| `trigger/triggerNode.ts`               | L3  | `ChangeControl`, `Global`, `Tool`, `trigger/triggerFunction`                             | 图 `1073741827`/`1073741833`：碰撞检测、运动定时器分发                                                            |
| `chessEntity/chessObjNode.ts`          | L3  | `Global`, `Tool`                                                                         | 图 `1073741834`/`1073741835`：棋子初始化、墙壁反弹                                                                |
| `chargePower/node/BeginCharge.ts`      | L3  | `resources/signals`, `UIControl/ControlUIFunc`                                           | 图 `1073741839`：开始蓄力                                                                                         |
| `chargePower/node/StopCharge.ts`       | L3  | `chessEntity/chessObjFunction`, `Global`, `resources/signals`, `UIControl/ControlUIFunc` | 图 `1073741838`：发射                                                                                             |
| `chargePower/node/ChargeChangeTick.ts` | L3  | —（仅引擎）                                                                              | 图 `1073741836`：蓄力累加                                                                                         |
| `chargePower/node/ResetCharge.ts`      | L3  | `resources/signals`                                                                      | 图 `1073741837`：重置蓄力                                                                                         |
| `playerEntity/node/playerCreate.ts`    | L3  | `resources/signals`                                                                      | 图 `1073741828`：镜头、阶段切换                                                                                   |
| `playerEntity/node/playerActive.ts`    | L3  | `ChangeControl`, `Global`, `resources/signals`, `UIControl/ControlUIFunc`                | 图 `1073741852`：选子、生成方向指示                                                                               |
| `playerEntity/node/ControlUISign.ts`   | L3  | `Global`, `resources/signals`, `UIControlGroupId`                                        | 图 `1073741841`/`1073741844`：方向控件显隐、左右切换、技能回调转发蓄力信号                                        |
| `playerEntity/node/playerTimers.ts`    | L3  | `ChangeControl`, `Global`, `resources/signals`                                           | 图 `1073741843`：倒计时超时处理                                                                                   |

## 依赖图（模块级）

```
                         resources/signals ─────────────┐
                         resources/prefabs (未被 src 引用) │
                                                          │
UIControlGroupId ◄── UIControl/ControlUIFunc ◄────────────┤
                                                          │
Global ◄── Tool ◄───────────────────────────┐            │
  ▲  ▲       ▲                               │            │
  │  │       └── ChangeControl ◄─────────────┤            │
  │  │              ▲                        │            │
  │  │              │                        │            │
  │  └── chessEntity/chessObjFunction ◄──────┤            │
  │                                          │            │
  ├── settlement/settleFunction ◄── ChessInit┤            │
  │        ▲                                 │            │
  │        └── trigger/triggerFunction ◄─ trigger/triggerNode
  │                                          │            │
  └────────── (被以下 L3 入口直接引用) ────────┘            │
                                                          │
L3 入口（注册 g.server，引擎驱动，彼此不 import）：           │
  ChessInit ── ChangeControl, settleFunction                │
  triggerNode ── ChangeControl, Global, Tool, triggerFunction│
  chessObjNode ── Global, Tool                               │
  BeginCharge ── signals, ControlUIFunc ◄────────────────────┘
  StopCharge ── chessObjFunction, Global, signals, ControlUIFunc
  ChargeChangeTick ── （无内部依赖）
  ResetCharge ── signals
  playerCreate ── signals
  playerActive ── ChangeControl, Global, signals, ControlUIFunc
  ControlUISign ── Global, signals, UIControlGroupId
  playerTimers ── ChangeControl, Global, signals
```

## 模块间通信方式

模块不只通过 `import` 耦合，运行时还通过三种隐式通道协作，改动时需一并考虑：

1. **信号（Signal）**：L3 入口之间靠 `send(Signal.X)` / `onSignal` 解耦通信（如倒计时超时 → `StopCharge`、玩家就绪 → 选子）。信号在 `resources/signals.ts` 统一定义，编辑器侧需先建立对应信号。
2. **实体变量（共享状态）**：stage / 玩家 / 棋子实体上的自定义变量是跨图共享的真实状态源（如 `moveList`、`curPlayer`、`canChange`、`settled`、`ischarge`）。`Global.getServerStageEntity()` 是访问关卡全局状态的统一入口。
3. **定时器**：普通定时器（`MoveActive`/`OutCheck`/`charge`/`CheckChessMovestage` 等）与全局定时器（红 / 黑方倒计时）驱动节点图的 `whenTimerIsTriggered` / `whenGlobalTimerIsTriggered`。全局定时器须先在编辑器侧定义。

## 关键耦合点（改动须注意）

- **`Global.ts`** 是最被依赖的基础模块（L1–L3 多处引用）。改阵营 ID、墙壁边界、定时器 / 标签 / 预制 ID、初始坐标会波及全局。
- **`getServerStageEntity()`（guid `1094713345`）** 是全局状态唯一入口；guid 变更需同步编辑器侧关卡实体。
- **回合状态机** 集中在 `ChangeControl.gstsServerSwitchTurn`，被 `ChessInit`（静止扫描）和 `playerTimers`（超时）两条路径触发；`canChange` 防抖 + 2s 延迟是切换正确性的关键。
- **结算入口** 统一收敛到 `settleFunction.gstsServerSettleGame`，由「将帅出界」「玩家退出」两类来源调用，`settled` 标记保证整局只结算一次。
- **ID 常量散落**：UI 控件组 ID 既有集中在 `UIControlGroupId.ts` 的，也有 `Tool.ts`/`ChangeControl.ts` 中硬编码的（如 `1073742874n` 错误提示、`timersId` 倒计时控件）；调整 UI 资源时两处都要检查。
- **编辑器前置**：预制、UI 控件组、信号、全局定时器、结算模板均为编辑器侧资源，代码仅按 ID 引用。详见 `EDITOR_BOUNDARIES_ZH.md`。
