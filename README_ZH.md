# 超象棋：弹射

这是一个基于 genshin-ts 的千星奇域项目。用 TypeScript 编写象棋弹射玩法逻辑，编译为节点图并注入到地图。

## 快速开始

```bash
npm install
npm run dev
```

文档站：`https://gsts.moe/zh`

## 项目结构

- `src/`：源代码目录（入口文件与模块）
- `gsts.config.ts`：编译与输出配置
- `dist/`：编译产物（`.gs.ts` / `.json` / `.gia`）
- `docs/EDITOR_BOUNDARIES_ZH.md`：代码与编辑器职责边界说明
- `CLAUDE.md` / `AGENTS.md`：AI 协作指引

## 注入配置示例（可选）

```ts
import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 1,
    mapId: 1073741849,
    nodeGraphId: 1073741825
  }
}

export default config
```

提示：

- `npm run maps` 可列出最近保存的地图，帮助确定 `mapId`。
- 多账号/多服务器时填写 `gameRegion` / `playerId` 以定位地图目录。
- 注入会自动做备份，便于回滚。

## 编辑器边界

本项目默认采用"代码优先"的开发方式，但千星奇域 / Genshin UGC 中仍有不少能力必须先由编辑器手动配置。

- 代码优先负责运行时规则：玩法流程、状态机、波次逻辑、经济结算、校验、刷怪、结算、信号编排。
- 编辑器负责资源与配置：元件、组件、路径、界面布局/控件组、信号、全局计时器、商店、货币、能力单元、文本气泡、小地图标识、音频资源等。
- 在设计或实现功能前，先查看 `docs/EDITOR_BOUNDARIES_ZH.md`，并明确区分代码改动与仍需手动完成的编辑器配置。

## Scripts

- `npm run build`：完整编译
- `npm run dev`：增量编译（配置 inject 后会自动注入）
- `npm run maps`：列出最近编辑的地图
- `npm run backup`：打开注入备份目录
- `npm run typecheck`：TypeScript 类型检查
- `npm run lint`：ESLint

## 常见问题

- `npm run maps` 为空：先在编辑器里保存一次地图，再重试。
- 注入失败：检查 `mapId` / `nodeGraphId` 是否正确，图类型是否匹配。
- 类型报错：优先检查 `.value` 的使用与引脚类型是否一致。
