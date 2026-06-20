import { g } from 'genshin-ts/runtime/core'

import { Tick_CheckChessMove } from '../../contracts/timers'
import { gstsServerSyncOpponentNicknamesOnBothJoined } from '../../systems/ui/opponentInfoUi'
import {
  gstsServerCheckPieceMovementState,
  gstsServerInitializeFirstTurnIfNeeded
} from '../../systems/turn/turnState'

g.server({
  id: 1073741842,
  name: 'ChessInitGraph'
}).on('whenEntityIsCreated', (_evt, f) => {
  f.startTimer(self, Tick_CheckChessMove, true, [3])
  let moveList = self.get('moveList').asType('entity_list')
  gsts.f.clearList(moveList)
  self.set('moveList', moveList)
  self.set('canChange', true)
  self.set('turnInitialized', false)
  //本局是否曾满员(2人)——满员单触发同步对方昵称用（见 gstsServerSyncOpponentNicknamesOnBothJoined）
  self.set('bothJoined', false)
  self.set('gstsInjectVerify', '2026-06-20-rematch-1')
})

g.server({
  id: 1073741842
}).on('whenTimerIsTriggered', (_evt, _f) => {
  //满员首次时互写对方昵称（原 settlement.gstsServerRefreshBothJoined 的昵称职责，结算废弃后迁出）
  gstsServerSyncOpponentNicknamesOnBothJoined()
  gstsServerInitializeFirstTurnIfNeeded()
  gstsServerCheckPieceMovementState()
})
