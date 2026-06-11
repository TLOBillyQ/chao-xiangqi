# 恢复的节点图

## newGetChessNode (id=1073741851)

> 2026-06-11：已反写为 TS 源码 `src/scanEntity/node/newGetChess.ts` 并随 `npm run build` 注入接管该图，
> 代码自此成为唯一事实源。本目录保留反编译时的原始 127 节点版本作存档。
> （注意坑：`g.server` 的 `name` 不能与源文件名相同，否则图名回退为文件夹名，见 docs/COMPILE_PITFALLS_ZH.md #1）

从实时存档 `...\BeyondLocal\342478178\Beyond_Local_Save_Level\1073741864.gil`（2026-06-11 14:38 存盘）提取。
图在存档中的实际名字是 `_GSTS_newGetChessNode`，类型 20000（实体节点图），127 个节点——
`_GSTS_` 前缀说明它是早期 gsts 工具链注入的编译产物，TS 源码从未进过本仓库 git 历史。

| 文件 | 说明 |
| --- | --- |
| `newGetChessNode_1073741851.readable.txt` | 人类可读反编译：图变量、全部节点（含模板名/引脚字面量/连线）、控制流边 |
| `newGetChessNode_1073741851.json` | protobufjs 按 gia.proto 解码的完整 JSON |
| `newGetChessNode_1073741851.gia` | 可注入的 .gia（用 dist 模板容器重新打包） |

## 如何再注入

图目前仍存在于实时存档中，未丢失。若将来在编辑器里误删，可用 genshin-ts 注入器把 `.gia` 写回：

```js
import { injectGilFile } from 'genshin-ts/dist/src/injector/index.js'
injectGilFile({
  gilPath: '<实时存档 1073741864.gil>',
  giaPath: 'recovered/newGetChessNode_1073741851.gia',
  targetId: 1073741851
})
```

注意「编辑器存盘覆盖注入」：必须退出地图后注入，再重开地图。

## 提取方法（可复用）

`.gil` 与 `.gia` 同为 protobuf 容器（20 字节头 + payload + 4 字节尾，headTag=0x326 / tailTag=0x679）。
用 `node_modules/genshin-ts/dist/src/injector/` 的 `parseMessage` 收集 `10.1.1` 路径的 NodeGraph blob，
再用 `proto.js` 的 schema（`thirdparty/.../protobuf/gia.proto`）decode，即可列出存档内全部 46 张图并按 id 提取。
节点模板 id → 名字/引脚签名映射在 `thirdparty/.../node_data/node_pin_records.js`。
