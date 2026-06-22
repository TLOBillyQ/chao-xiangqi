import { g } from 'genshin-ts/runtime/core'

import { PlayerVar } from '../../contracts/variables'
import { gstsServerReconcileLandingMarker } from '../../systems/charge/landingPreview'

g.server({
  id: 1073741836,
  name: 'ChargeChangeTick'
}).on('whenTimerIsTriggered', (_evt, f) => {
  let entity = f.getSelfEntity()
  let isCharge = f.getCustomVariable(entity, PlayerVar.isCharge).asType('bool')
  let chargePower = f.getCustomVariable(entity, PlayerVar.chargePower).asType('float')

  if (isCharge) {
    chargePower += 2
  }

  f.setCustomVariable(entity, PlayerVar.chargePower, chargePower)

  if (isCharge) {
    gstsServerReconcileLandingMarker(entity)
  }
})
