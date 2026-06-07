import { g } from 'genshin-ts/runtime/core'

import * as ChangeControl from '../../ChangeControl'
import { factionBlack, factionRed } from '../../Global'

g.server({
  id: 1073741843,
  name: 'playerTimers'
}).on('whenGlobalTimerIsTriggered', (_evt, f) => {
  //console.log("计时器结束")
  if (_evt.timerName == '黑方倒计时' && ChangeControl.gstsServerCanControl() == 1) {
    let player = f.getEntityListBySpecifiedFaction(
      f.getListOfPlayerEntitiesOnTheField(),
      factionBlack
    )[0]
    if (player.get('ischarge').asType('bool')) send('StopCharge')
    //else ChangeControl.gstsServerChangeControl_Test()
    else ChangeControl.gstsServerChangeControl()
  } else if (_evt.timerName == '红方倒计时' && ChangeControl.gstsServerCanControl() == 1) {
    let player = f.getEntityListBySpecifiedFaction(
      f.getListOfPlayerEntitiesOnTheField(),
      factionRed
    )[0]
    if (player.get('ischarge').asType('bool')) send('StopCharge')
    //else ChangeControl.gstsServerChangeControl_Test()
    else ChangeControl.gstsServerChangeControl()
  }
})
