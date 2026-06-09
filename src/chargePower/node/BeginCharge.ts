import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerHideUIByChargeBegin } from '../../UIControl/ControlUIFunc'

g.server({
  id: 1073741839,
  name: 'BeginCharge'
}).onSignal(Signal.BeginCharge, (_evt, _f) => {
  //用于替换
  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  print(str('CHARGE_BEGIN_RECV'))
  if (entity == self) {
    print(str('CHARGE_BEGIN_SELF'))
    //UI控制
    gstsServerHideUIByChargeBegin(self)
    self.set('ischarge', true)
    self.startTimer('charge', true, [0.03])
  }
})
