import { g } from 'genshin-ts/runtime/core'

import { PlayerVar } from '../../contracts/variables'
import { Signal } from '../../resources/signals'
import { gstsServerDestroyLandingMarker } from '../../systems/charge/landingPreview'
import {
  gstsServerDestroyOldDirectionMarkers,
  gstsServerResolveSelectedDir
} from '../../systems/piece/directionMarkers'
import { gstsServerConfirmAndMovePiece, gstsServerFinishLaunch } from '../../systems/piece/launch'
import { gstsServerHideUIByChargeStop } from '../../systems/ui/directionUi'

g.server({
  id: 1073741838,
  name: 'StopCharge'
}).onSignal(Signal.StopCharge, (_evt, _f) => {
  let isForSelf = false
  if (_evt.signalSourceEntity == self) {
    isForSelf = true
  } else {
    let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
    if (entity == self) isForSelf = true
  }
  if (isForSelf) {
    if (self.get(PlayerVar.isCharge).asType('bool')) {
      let powerPercent = gsts.f.getCustomVariable(self, PlayerVar.chargePower).asType('float') / 100
      let dirEntity = gstsServerResolveSelectedDir(self)
      if (dirEntity != self) {
        gstsServerConfirmAndMovePiece(dirEntity, powerPercent, self)
      }
      gstsServerDestroyOldDirectionMarkers()

      //发射后销毁落点指示
      gstsServerDestroyLandingMarker()

      //清理发射后玩家蓄力/选子状态
      gstsServerFinishLaunch(self)

      //UI控制
      gstsServerHideUIByChargeStop(self)
    }
  }
})
