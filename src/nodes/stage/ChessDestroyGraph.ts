import { g } from 'genshin-ts/runtime/core'

import { PieceVar } from '../../contracts/variables'
import { gstsServerOnChessDestroyed } from '../../systems/stage/chessDestroy'

/**
 * 历史图 `_GSTS_chessDestroy`(1073741850) 同 ID 接管。挂【关卡实体】——「实体销毁时」仅在关卡实体上触发。
 * 见 docs/adr/0002-historical-graph-same-id-takeover.md、recovered/orphan-nodegraphs/TAKEOVER_CHECKLIST.md ②。
 *
 * 事件源=被销毁棋子：棋子类型/阵营 必须从销毁快照(customVariableComponentSnapshot)读，不能直接 get
 * （实体已在销毁）；死方阵营取 _evt.faction、归属玩家取 _evt.ownerEntity。关卡状态由 helper 内 getServerStageEntity()。
 */
g.server({ id: 1073741850, name: 'ChessDestroy' }).on('whenEntityIsDestroyed', (_evt, _f) => {
  let snapshot = _evt.customVariableComponentSnapshot
  let curPieceType = gsts.f.queryCustomVariableSnapshot(snapshot, PieceVar.pieceType).asType('str')
  let curFaction = gsts.f.queryCustomVariableSnapshot(snapshot, PieceVar.faction).asType('str')
  gstsServerOnChessDestroyed(
    curPieceType,
    curFaction,
    _evt.faction,
    _evt.ownerEntity as typeof self
  )
})
