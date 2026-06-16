import { g } from 'genshin-ts/runtime/core'

import { gstsServerScanPieceTick } from '../../systems/scan/scanPiece'

//从 .gil 反编译恢复的扫描图（原图 _GSTS_newGetChessNode，id=1073741851，127 节点，源码曾遗失）
//挂在「跟随玩家实体」的扫描实体上（跟随运动器为编辑器侧配置）：
//每 0.03s 在玩家正下方 5.66 处、半径 1 范围内找己方最近的棋子，
//给它挂选中光效（10010010，缩放1.4）并写入玩家的 ScanEntity；失焦时清光效、ScanEntity 置回扫描实体自身作空哨兵

g.server({
  id: 1073741851,
  name: 'newGetChessNode'
}).on('whenEntityIsCreated', (_evt, f) => {
  f.startTimer(self, 'newgetChess', true, [0.03])
})

g.server({
  id: 1073741851
}).on('whenTimerIsTriggered', (_evt, _f) => {
  gstsServerScanPieceTick()
})
