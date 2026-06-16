import { g } from 'genshin-ts/runtime/core'

import {
  gstsServerRefreshBothJoined,
  gstsServerSettleIfOpponentAbsent,
  gstsServerSettleIfPlayerLeft
} from '../../systems/settlement/settlement'
import { gstsServerCheckPieceMovementState } from '../../systems/turn/turnState'

g.server({
  id: 1073741842,
  name: 'ChessInitGraph'
}).on('whenEntityIsCreated', (_evt, f) => {
  f.startTimer(self, 'CheckChessMovestage', true, [3])
  self.set('canChange', true)
  //结算一次性保护标记
  self.set('settled', false)
  //结算胜负结果（红方是否获胜），显示结算 UI 时写入、点击结算按钮时读回
  self.set('redWin', false)
  //本局是否曾满员(2人)——退出检测用，避免单人试玩/吃子销毁误判为有人离场
  self.set('bothJoined', false)
  //对方缺席超时判定的等待周期计数（实测约1秒/周期，见 gstsServerSettleIfOpponentAbsent）
  self.set('waitTicks', 0)
  self.set('gstsInjectVerify', '2026-06-10-settle-clean-1')
})

g.server({
  id: 1073741842
}).on('whenTimerIsTriggered', (_evt, _f) => {
  gstsServerRefreshBothJoined()
  //对方从未加入时的缺席超时结算（约1分钟，见 OPPONENT_WAIT_TICKS）
  gstsServerSettleIfOpponentAbsent()
  gstsServerCheckPieceMovementState()
})

g.server({
  id: 1073741842
}).on('whenEntityIsRemovedDestroyed', (_evt, _f) => {
  //引擎无「玩家离开」事件；玩家退出会移除其玩家实体，借「实体移除/销毁时」探测中途退出
  gstsServerSettleIfPlayerLeft()
})
