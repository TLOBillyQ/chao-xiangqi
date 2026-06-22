import { g } from 'genshin-ts/runtime/core'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { GlobalTimer_BlackCountdown, GlobalTimer_RedCountdown } from '../../contracts/timers'
import * as TurnState from '../../systems/turn/turnState'

g.server({
  id: 1073741843,
  name: 'playerTimers'
}).on('whenGlobalTimerIsTriggered', (_evt, _f) => {
  if (_evt.timerName == GlobalTimer_BlackCountdown) {
    TurnState.gstsServerHandleCountdownTimeout(factionBlack)
  } else if (_evt.timerName == GlobalTimer_RedCountdown) {
    TurnState.gstsServerHandleCountdownTimeout(factionRed)
  }
})
