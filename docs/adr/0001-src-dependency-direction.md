# ADR 0001: `src/` 依赖方向与模块边界

## 状态

已采纳，待实现。

## 日期

2026-06-16

## 背景

`src/` 现在已经能编译并承载完整玩法，但模块边界开始影响后续开发。

几个文件承担了过多职责：

- `Global.ts` 同时放阵营、物理常量、棋盘边界、预制体 ID、标签 ID、定时器名、棋子方向规则和 `getServerStageEntity()`。
- `Tool.ts` 同时放向量转换、反射、碰撞冲量、真实碰撞点和 UI 播报。
- `ControlUISign.ts` 同时处理方向控件、规则页、相机切换、结算按钮和技能节点回调。
- `docs/ARCHITECTURE_ZH.md` 描述的分层已经落后于当前代码，漏掉了落点预览、扫描图和新版结算 UI 流程。

这些问题不会立刻造成运行错误，但会让多个代理同时开发时互相抢同一批文件。最容易冲突的是全局常量、UI 控件、回合状态和入口节点图。

这个项目还受 Genshin-TS 和编辑器契约约束。`g.server({ id, name })` 里的 `name` 是编辑器契约，不是普通代码命名。`src/resources/signals.ts` 和 `src/resources/prefabs.ts` 会在构建时自动生成，不能手改。`dist/` 是编译产物，不能手改。

## 决策

`src/` 按依赖方向重构为四层：

```text
contracts/resources
        ↓
core helpers
        ↓
systems: ui / turn / piece / charge / motion / settlement / scan
        ↓
nodes: only g.server entry files
```

依赖只能向下。入口文件只注册 `g.server` 事件和信号，调用系统函数，不被其他模块 import。系统层承载玩法逻辑。`core` 放无领域归属的 helper。`contracts` 和 `resources` 放编辑器 ID、信号、预制体、棋盘常量、变量名约定和节点图契约。

## 目录目标

建议目标结构：

```text
src/
  contracts/
    editorIds.ts
    graphIds.ts
    stage.ts
    timers.ts
    variables.ts
  core/
    vector.ts
    physics.ts
  systems/
    charge/
      landingPreview.ts
      chargeState.ts
    motion/
      movement.ts
      collision.ts
      outOfBounds.ts
    piece/
      directions.ts
      selection.ts
      launch.ts
    scan/
      scanPiece.ts
    settlement/
      settlement.ts
    turn/
      turnState.ts
    ui/
      directionUi.ts
      broadcastUi.ts
      cameraUi.ts
      rulePageUi.ts
  nodes/
    stage/
    player/
    piece/
    charge/
    motion/
    scan/
  resources/
    signals.ts
    prefabs.ts
```

这只是目标边界，不要求一次搬完。实际迁移时优先保持函数名和行为不变。

## 具体规则

- `nodes/**` 只能 import `systems/**`、`contracts/**`、`resources/**` 和 Genshin-TS 类型，不被项目内其他文件 import。
- `systems/**` 可以依赖 `core/**`、`contracts/**`、`resources/**`，不能依赖 `nodes/**`。
- `core/**` 不依赖 `systems/**`，只放向量、物理等可复用 helper。
- `contracts/**` 不依赖业务系统，集中放编辑器 ID、图 ID、变量名、定时器名、关卡实体查询等契约。
- 不建立全局 `src/index.ts` barrel，避免隐藏真实依赖方向。
- 不引入路径别名。当前 `tsconfig.json` 没有别名，继续使用相对 import。
- 不改 `gsts.config.ts` 的 `entries: ['./src']`。
- 不改已注入节点图的 `id` 和 `name`。
- 不手改 `src/resources/signals.ts`、`src/resources/prefabs.ts`、`dist/`。

## 迁移顺序

1. 修正当前 lint 基线。`StopCharge.ts` 只有 import 排序不符合 Prettier，先让 `npm run lint` 回到可用状态。
2. 新建 `contracts/`，从 `Global.ts` 和 `UIControlGroupId.ts` 拆出编辑器 ID、棋盘边界、定时器名、stage 查询和变量名约定。原文件可短期保留 re-export，降低一次性改动。
3. 新建 `core/`，从 `Tool.ts` 拆出向量转换、反射、碰撞冲量和真实碰撞点。UI 播报不放在 `core`。
4. 新建 `systems/ui/`，承接方向 UI、蓄力 UI、播报 UI、规则页 UI、相机切换和结算按钮入口调用。
5. 新建 `systems/turn/`、`systems/piece/`、`systems/motion/`、`systems/charge/`、`systems/settlement/`、`systems/scan/`，按当前职责搬迁函数，先不改行为。
6. 把入口文件移入 `nodes/`。移动后删除 `dist/` 再全量构建，避免增量编译残留旧产物和新文件撞同一个 `g.server` id。
7. 更新 `docs/ARCHITECTURE_ZH.md` 和必要的游戏流程文档，让文档描述当前源码，而不是旧结构。

每一步都必须独立可合并。某一步做完后，即使后续步骤暂停，项目也应能继续 typecheck 和 lint。

## 验证

每个迁移步骤至少执行：

```bash
npm run typecheck
npm run lint
```

需要验证 Genshin-TS 输出时，先在编辑器里完全退出当前地图，再执行：

```bash
Remove-Item -Recurse -Force dist
npm run build
```

构建后优先检查 `.gs.ts` 和 `.json`，确认节点图 ID 没变、事件仍挂在原图上、信号和定时器名没有漂移。

## 影响

好处：

- 后续新增功能可以按系统目录拆任务，减少多人同时改 `Global.ts`、`Tool.ts`、`ControlUISign.ts` 的概率。
- 编辑器契约集中后，改 UI 控件组、预制体、定时器和图 ID 时更容易定位影响面。
- 入口文件变薄后，节点图事件和玩法逻辑分开，排查 `.gs.ts`、`.json` 输出时更直接。

代价：

- 第一轮会触及较多 import，评审成本高于小修。
- 文件移动会让 `dist/` 的增量产物风险变高，必须全量重编。
- 如果迁移时顺手改行为，风险会明显上升，所以本 ADR 要求先做结构迁移，不混入玩法改动。

## 不做的方案

不做一次性大重写。当前玩法已经能跑，重写会把结构风险和行为风险叠在一起。

不做只写文档、不动代码。文档可以解释现状，但不能降低后续代理抢同一文件的冲突。

不引入新框架、路径别名或代码生成层。这个项目的复杂度来自节点图契约和编辑器边界，不需要再加一层工具。

## 回滚

本 ADR 本身只新增文档，可以直接删除回滚。

实现重构时，每个阶段都应是纯源码移动和 import 调整。若某阶段构建失败，优先回滚该阶段提交，不动编辑器资源、不手改 `dist/`。
