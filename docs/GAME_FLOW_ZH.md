# 游戏流程（超象棋：弹射）

本文描述对局从初始化到结算的完整运行流程，以及每一步背后由哪个节点图 / 函数驱动。
代码侧只负责运行时规则；棋盘、棋子、方向控件、UI 控件组、全局定时器等资源为编辑器侧预置（见 `EDITOR_BOUNDARIES_ZH.md`）。

## 核心概念

| 概念           | 说明                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 关卡实体 stage | guid `1094713345`，全局状态载体。变量：`moveList`（运动中棋子列表）、`curPlayer`（当前回合玩家）、`canChange`（允许切换回合）、`settled`（整局结算一次性保护）、`ErrorMsg`、全局定时器「红方倒计时 / 黑方倒计时」。                                                                              |
| 玩家实体       | `player(1)`=红方=`faction(1)`，`player(2)`=黑方=`faction(4)`。单人试玩会在【试玩时玩家编号】中固定进入 player1 或 player2，因此在场玩家列表可能只有红方或只有黑方。变量：`isControl`（是否本回合操控权）、`ischarge`/`chargePower`（蓄力态与力度）、`curDirIndex`/`curChessType`/`curChooseChess`（当前选中棋子与方向）、`startPos`（本次发射出发点）、`step`（步数）、`ScanEntity`（扫描命中实体）。 |
| 棋子实体       | 变量：`棋子类型`（车/马/象/士/帅/炮/兵/兵过河）、`Mass`、`moveVec`（速度向量）、`initSpeed`（基础初速）、`triggerCount`（撞击次数）、`isStart`（是否本回合主动发射子）、`triggerGuidList`（已碰撞过的对象，去重用）。owner 指向所属玩家。                                                        |
| 方向指示实体   | 选子后围绕棋子生成的箭头预制体。变量：`moveVec`（该方向单位向量）、`dirUIIndex`（与 UI 控件序号对应）。owner 指向目标棋子。红/黑各一种预制（`dirPrefabs`）。                                                                                                                                     |

## 流程总览

```
初始化 → 选子 → 选方向 → 蓄力 → 发射 → 运动/碰撞/反弹 → 静止判定
   ↑                                                          │
   └──────────────── 切换回合（双方轮流）←──────────────────────┘
                                  │
            出界(将/帅被吃) / 玩家退出 / 倒计时 → 结算（一次性）
```

## 1. 初始化

- **玩家创建**（`playerCreate.ts` / 图 `1073741828`）：`whenEntityIsCreated` 重置玩家操控/蓄力/选子状态，设置准备镜头跟随、隐藏角色模型；3 秒后 `send(chgPlayerStage)` 通知阶段切换。
- **关卡创建**（`ChessInit.ts` / 图 `1073741842`）：`whenEntityIsCreated` 启动 `CheckChessMovestage` 循环定时器（3s），清空 `moveList`，并初始化 `canChange=true`、`turnInitialized=false`、`settled=false`。
- **首回合初始化**（`systems/turn/turnState.ts`）：定时器首次发现未初始化时按在场玩家设置 `curPlayer/isControl`；双人在场时红方先手，单人 player1/player2 试玩时谁在场就让谁先手，避免把操控权切给缺席玩家。
- **棋子创建**（`chessObjNode.ts` / 图 `1073741834`）：每枚棋子 `whenEntityIsCreated` 初始化 `triggerCount=0`、`isStart=false`。
- 棋子初始坐标与预制映射见 `contracts/stage.ts` 的 `initPos`（红/黑各 16 枚）。

## 2. 选子（点击棋子）

`playerActive.ts` / 图 `1073741852`，监听 `Signal.GetPiece`：

1. 校验是否为本玩家、`gstsServerCanControl()==1`（即 `moveList` 为空，无棋子在运动）。
2. 命中实体标签为 `EntityTag.Piece` 时，调用 `gstsServerCreateDirectionIndicators`：
   - 先销毁旧的方向指示（`gstsServerDestroyOldDirectionMarkers`）。
   - 按阵营 + 棋子类型从 `gstsServerRedPieceDirections` / `gstsServerBlackPieceDirections` 取可走方向列表；兵过中线（`Wall.center`）自动切为「兵过河」。
   - 围绕棋子为每个方向生成方向指示预制，写入 `moveVec` 与 `dirUIIndex`。
   - 记录玩家 `curChessType` / `curChooseChess`。
3. 激活方向切换 UI 与蓄力虚拟按钮（`gstsServerActivateSwitchUI`）；按阵营和棋子类型打开对应棋子方向 UI 组（兵 / 卒会区分未过河与过河），并默认高亮首个方向（`gstsServerActivateDirectionUI`）。

## 3. 选方向（左右切换）

`ControlUISign.ts` / 图 `1073741844`，`whenUiControlGroupIsTriggered`：

- 根据 `curChessType` 取对应方向控件 ID 列表（`contracts/editorIds.ts` 的 `dirContrlId`），棋子方向 UI 组 ID 见 `redPieceDirectionUi` / `blackPieceDirectionUi`。
- 左 / 右按钮（`changeDir.left/right`）循环 `curDirIndex`，关闭旧高亮、打开新高亮。

## 4. 蓄力

- **技能输入**（`ControlUISign.ts` / 图 `1073741844`，`whenSkillNodeIsCalled`）：编辑器侧按钮驱动技能；技能节点以参数 `BeginCharge` / `StopCharge` 回调服务端，服务端再发送对应信号。
- **开始**（`BeginCharge.ts` / 图 `1073741839`，`Signal.BeginCharge`）：隐藏方向 UI、显示进度条（`gstsServerHideUIByChargeBegin`），`ischarge=true`，启动 `charge` 定时器（0.03s）。
- **充能 tick**（`ChargeChangeTick.ts` / 图 `1073741836`）：每 tick `chargePower += 2`。
- **重置**（`ResetCharge.ts` / 图 `1073741837`，`Signal.ResetCharge`）：`chargePower=0`。

## 5. 发射

`StopCharge.ts` / 图 `1073741838`，`Signal.StopCharge`：

1. `powerPercent = chargePower / 100`。
2. 遍历场上方向指示预制，找到 `dirUIIndex == curDirIndex` 的那一个，调用 `gstsServerConfirmAndMovePiece`（`systems/piece/launch.ts`）：
   - 将该方向 `moveVec` 三维转二维（`gstsServerVec3ToVec2`），棋子 `isStart=true`，挂拖尾光效。
   - 加入 `moveList`，记录玩家 `startPos`。
   - 兵过河后 `initSpeed` 提升为 25。
   - 速度 = `方向 × initSpeed × powerPercent`，挂匀速直线运动器。
   - 启动 `MoveActiveTriggerBefore`（碰撞前阻尼插值）与 `OutCheck`（出界检测）定时器。
3. 销毁全部方向指示，清理 `curDirIndex/curChooseChess`，`isControl=false`，`step += 1`，蓄力变量归零，隐藏蓄力 UI。

## 6. 运动 / 碰撞 / 反弹

- **速度插值**（`systems/motion/movement.ts` `gstsServerMoveChangeTick`，由 `moveActChange` 图 `1073741833` 的 `MoveActive` / `MoveActiveTriggerBefore` 定时器驱动）：每 tick 按阻尼系数衰减速度；速度 < 0.1 时停止运动器、清理 `triggerCount/isStart/moveVec/triggerGuidList` 与相关定时器。
  - `MoveActiveTriggerBefore` 用较小阻尼 `deltaMoveTriggerBefore`；碰撞后切到 `MoveActive` 用 `deltaMove`。
- **棋子互撞**（`triggerNode.ts` 图 `1073741827`，`whenOnHitDetectionIsTriggered`）：
  - 双方各 `triggerCount += 1`，都加入 `moveList`，并用 `triggerGuidList` 去重避免重复结算同一对碰撞。
  - 「炮」首次命中（`triggerCount==0` 且 `isStart`）走特殊加速逻辑；其余走 `gstsServerCalculateImpulse`（2D 刚体冲量算法，计算法向 / 切向冲量、线速度与自转）。
- **墙壁反弹**（`chessObjNode.ts` 图 `1073741835` NineCeilWall）：仅 `isStart` 的主动子触墙时按墙面法线 `FA` 反射速度（`gstsServerCalculateReflectVector`），更新出发点。

## 7. 静止判定与回合切换

`systems/turn/turnState.ts`：

- `CheckChessMovestage`（图 `1073741842` 定时器，3s）扫描 `moveList`，移除速度 < 0.1 的棋子；当 `moveList` 清空时调用 `gstsServerSwitchTurn`。
- `gstsServerSwitchTurn`：读取当前 `curPlayer` 阵营，在 `canChange=true` 时：
  - 先从在场玩家列表里按阵营寻找红方/黑方实体，不直接假设两个玩家都在场。
  - 广播回合提示（`gstsServerErrorMsg`），关闭当前方倒计时 UI。
  - `canChange=false` 防抖，关掉当前方倒计时全局定时器。
  - 延迟 2s 后切换 `curPlayer`、目标方 `isControl=true`、打开其倒计时 UI 并启动其倒计时全局定时器；若目标方缺席（单人试玩），则保持当前在场方继续可操作。

## 8. 倒计时超时

`playerTimers.ts` / 图 `1073741843`，`whenGlobalTimerIsTriggered`：

- 「红方/黑方倒计时」触发且当前无棋子运动时：若该玩家正在蓄力则强制 `send(Signal.StopCharge)`（即按当前力度发射），否则直接 `gstsServerSwitchTurn` 切换回合。

## 9. 出界与结算

- **出界**（`systems/motion/outOfBounds.ts` `gstsServerOutCheck`，由 `OutCheck` 定时器驱动）：棋子坐标越过 `Wall` 边界即判定出界 →
  - 记录棋子是否为将/帅、被吃方是否红方；停掉运动器与检测定时器。
  - 按出界方向播放翻落动画，1s 后下落 + 落地特效，3s 后 `destroy()`。
  - 若被吃的是将/帅，落子动画结束后调用 `systems/settlement/settlement.ts` 的 `gstsServerSettleGame(redWin)` 结算整局。
- **玩家中途退出**（`systems/settlement/settlement.ts` `gstsServerSettleIfPlayerLeft`，由 stage 图 `whenEntityIsRemovedDestroyed` 触发）：引擎无「玩家离开」事件，借实体移除事件 + 在场玩家数判定；在场仅剩 1 人时，剩余方判胜并结算。
- **一次性结算**（`gstsServerSettleGame`）：用 stage 的 `settled` 标记保证整局只结算一次；按 `redWin` 给双方设胜负，调用 `settleStage()` 弹出个人结算界面。
  - 前置：编辑器侧需在【关卡设置 - 结算】配置「个人结算」与计分 / 排名模板。

## 节点图 ID 速查

| 图 ID      | 名称                         | 触发                     | 职责                                     |
| ---------- | ---------------------------- | ------------------------ | ---------------------------------------- |
| 1073741842 | ChessInitGraph               | 创建 / 定时器 / 实体移除 | 关卡初始化、静止扫描、退出结算           |
| 1073741828 | playerCreated                | 创建 / 定时器            | 镜头、阶段切换信号                       |
| 1073741834 | ChessCreate                  | 创建                     | 棋子变量初始化                           |
| 1073741852 | getCurrentPiece              | Signal.GetPiece          | 选子、生成方向指示、激活 UI              |
| 1073741844 | changeDir / chargeSkillInput | UI 控件组 / 技能节点     | 左右切换方向、接收技能回调并转发蓄力信号 |
| 1073741841 | ControlUI                    | Signal.ControlUI         | 方向控件显隐                             |
| 1073741839 | BeginCharge                  | Signal.BeginCharge       | 开始蓄力                                 |
| 1073741836 | ChargeChangeTick             | 定时器                   | 蓄力累加                                 |
| 1073741838 | StopCharge                   | Signal.StopCharge        | 发射棋子                                 |
| 1073741837 | ResetCharge                  | Signal.ResetCharge       | 重置蓄力                                 |
| 1073741827 | trigger                      | 命中检测                 | 棋子互撞冲量                             |
| 1073741833 | moveActChange                | 定时器                   | 速度插值 / 出界检测分发                  |
| 1073741835 | NineCeilWall                 | 命中检测                 | 墙壁反弹                                 |
| 1073741843 | playerTimers                 | 全局定时器               | 倒计时超时处理                           |
