import { g } from 'genshin-ts/runtime/core'

g.server({
  id: 1073741836,
  name:"ChargeChangeTick"
}).on('whenTimerIsTriggered', (_evt, f) => {
  let entity = f.getSelfEntity()
  let isCharge = f.getCustomVariable(entity, 'ischarge').asType('bool')
  let chargePower = f.getCustomVariable(entity, 'chargePower').asType('float')


  if (isCharge) {
    chargePower += 2
  }
  
  f.setCustomVariable(entity, 'chargePower', chargePower)
})