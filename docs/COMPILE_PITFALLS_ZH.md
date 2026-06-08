# 编译与注入常见坑

记录在 chao-xiangqi 编译/注入流程中容易踩、且不易自查的问题。

语言说明：
- 以中文协作时，优先阅读本文件。
- 若以英文协作，可配合 `docs/COMPILE_PITFALLS.md` 使用。

## 1. `g.server` 的 `name` 不能和源文件名相同

**现象**：给节点图改了一个英文 `name`，注入后编辑器里的图名却变成了 `_GSTS_src`（或文件夹名），不是你填的名字。

**原因**：编译器把"与源文件名相同的 name"当成 runner 自动生成的默认名而丢弃。判定逻辑在 `node_modules/genshin-ts/dist/src/compiler/ir_merge.js` 的 `isExplicitGraphNameForSource()`：strip 掉 `_GSTS_` 前缀后，若 `name`（忽略大小写）等于去扩展名的源文件名，就视为"非显式命名"，合并时退回用文件夹名兜底。

**实例**：文件 `ChessInit.ts` + `name: 'ChessInit'` → 退回 `_GSTS_src`；改成 `name: 'ChessInitGraph'` 后正常显示 `_GSTS_ChessInitGraph`。

**做法**：给 `g.server` 的 `name` 起一个和文件名不同的值（加后缀如 `XxxGraph`，或用中文显示名）。注意 `name` 只是编辑器显示名，真正的身份标识是 `id`，改名不影响逻辑与注入对应关系。

## 2. `npm run dev` 增量编译会残留旧 dist 产物

**现象**：重命名或删除源文件后，编译/注入出现同一 `id` 冲突或图名异常。

**原因**：`dev` 是增量编译，**不会删除已被改名/删除的源文件对应的旧 dist 产物**。旧 `.json` 残留会和新文件撞同一个 `g.server` id。

**实例**：把 `Gameinit.ts` 改名为 `ChessInit.ts` 后，`dist/src/Gameinit.json`（id 1073741842）仍在，与新 `ChessInit.json` 同 id 冲突。

**做法**：改名或删除源文件后，先 `rm -rf dist` 再 `npm run build` 全量重编再注入。`dist` 是生成物，删除安全（`CLAUDE.md` 也禁止手改 `dist`）。
