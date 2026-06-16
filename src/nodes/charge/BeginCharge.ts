import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerHideUIByChargeBegin } from '../../systems/ui/directionUi'

g.server({
  id: 1073741839,
  name: 'BeginCharge'
}).onSignal(Signal.BeginCharge, (_evt, _f) => {
  //用于替换
  let isForSelf = false
  if (_evt.signalSourceEntity == self) {
    isForSelf = true
  } else {
    let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
    if (entity == self) isForSelf = true
  }
  if (isForSelf) {
    //UI控制
    gstsServerHideUIByChargeBegin(self)
    self.set('ischarge', true)
    self.startTimer('charge', true, [0.03])
  }
})
