import { g } from 'genshin-ts/runtime/core'
import { gstsServerHideUIByChargeBegin } from '../../UIControl/ControlUIFunc'
import { Signal } from '../../resources/signals'
g.server({
  id: 1073741839,
  name:"BeginCharge",
}).onSignal(Signal.BeginCharge, (_evt, _f) => {
  //用于替换
  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if(entity == self)
  {
    //UI控制
    gstsServerHideUIByChargeBegin(self)
    self.set("ischarge",true)
    self.startTimer("charge",true,[0.03])
  }
})
