import { g } from 'genshin-ts/runtime/core'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { GlobalTimer_BlackCountdown, GlobalTimer_RedCountdown } from '../../contracts/timers'
import { Signal } from '../../resources/signals'
import * as TurnState from '../../systems/turn/turnState'

g.server({
  id: 1073741843,
  name: 'playerTimers'
}).on('whenGlobalTimerIsTriggered', (_evt, f) => {
  if (_evt.timerName == GlobalTimer_BlackCountdown && TurnState.gstsServerCanControl() == 1) {
    let players = f.getEntityListBySpecifiedFaction(
      f.getListOfPlayerEntitiesOnTheField(),
      factionBlack
    )
    if (players.length > 0) {
      let player = players[0]
      if (player.get('ischarge').asType('bool')) send(Signal.StopCharge)
      //else TurnState.gstsServerSwitchTurn_Test()
      else TurnState.gstsServerSwitchTurn()
    }
  } else if (_evt.timerName == GlobalTimer_RedCountdown && TurnState.gstsServerCanControl() == 1) {
    let players = f.getEntityListBySpecifiedFaction(
      f.getListOfPlayerEntitiesOnTheField(),
      factionRed
    )
    if (players.length > 0) {
      let player = players[0]
      if (player.get('ischarge').asType('bool')) send(Signal.StopCharge)
      //else TurnState.gstsServerSwitchTurn_Test()
      else TurnState.gstsServerSwitchTurn()
    }
  }
})
