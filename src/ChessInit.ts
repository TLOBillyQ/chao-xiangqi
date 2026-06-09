import { g } from 'genshin-ts/runtime/core'

import { gstsServerCheckChessMovestage } from './ChangeControl'
import {
  gstsServerRefreshBothJoined,
  gstsServerSettleIfPlayerLeft
} from './settlement/settleFunction'

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
  self.set('gstsInjectVerify', '2026-06-03-verify-1')
  print(str('PROBE_STAGE_INIT_DONE'))
})

g.server({
  id: 1073741842
}).on('whenTimerIsTriggered', (_evt, _f) => {
  gstsServerRefreshBothJoined()
  gstsServerCheckChessMovestage()
})

g.server({
  id: 1073741842
}).on('whenEntityIsRemovedDestroyed', (_evt, _f) => {
  //引擎无「玩家离开」事件；玩家退出会移除其玩家实体，借「实体移除/销毁时」探测中途退出
  print(str('PROBE_DESTROY_FIRED'))
  gstsServerSettleIfPlayerLeft()
})
