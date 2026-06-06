import { g } from 'genshin-ts/runtime/core'

//重置充能
g.server({
  id: 1073741837,
  name: 'ResetCharge'
}).onSignal('ResetCharge', (_evt, f) => {

  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if(entity == self)
  {
    let playentity = f.getSelfEntity()
    f.setCustomVariable(playentity, 'chargePower', 0)
  }
})