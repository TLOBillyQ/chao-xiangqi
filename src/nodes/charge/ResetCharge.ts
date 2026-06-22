import { g } from 'genshin-ts/runtime/core'

import { PlayerVar } from '../../contracts/variables'
import { Signal } from '../../resources/signals'

//重置充能
g.server({
  id: 1073741837,
  name: 'ResetCharge'
}).onSignal(Signal.ResetCharge, (_evt, f) => {
  let isForSelf = false
  if (_evt.signalSourceEntity == self) {
    isForSelf = true
  } else {
    let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
    if (entity == self) isForSelf = true
  }
  if (isForSelf) {
    let playentity = f.getSelfEntity()
    f.setCustomVariable(playentity, PlayerVar.chargePower, 0)
  }
})
