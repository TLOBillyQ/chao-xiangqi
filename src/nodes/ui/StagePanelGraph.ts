import { g } from 'genshin-ts/runtime/core'
import type { entity } from 'genshin-ts/runtime/value'

import {
  btn_closeRulePage,
  btn_closeRulePageLegacy,
  btn_exitGame,
  btn_Ready,
  btn_reGame,
  btn_showLike,
  btn_viewRules,
  btn_viewRulesInGame
} from '../../contracts/editorIds'
import { GraphId } from '../../contracts/graphIds'
import { Signal } from '../../resources/signals'
import {
  gstsServerAddLikeScore,
  gstsServerConfirmSettleFromLegacyExit,
  gstsServerMarkNotReadyAfterRulePage,
  gstsServerMarkOpponentExitFromSignal,
  gstsServerMarkViewingRules,
  gstsServerShowOpponentLeftPrompt,
  gstsServerSyncOpponentStageState,
  gstsServerToggleReadyState
} from '../../systems/ui/stagePanelUi'
import { gstsServerRestoreTitleAfterRulePage } from '../../systems/ui/rulePageUi'

g.server({
  id: GraphId.stagePanel,
  name: 'StagePanel'
}).on('whenUiControlGroupIsTriggered', (_evt, _f) => {
  if (_evt.uiControlGroupIndex == btn_Ready || _evt.uiControlGroupIndex == btn_reGame) {
    gstsServerToggleReadyState(_evt.eventSourceEntity as entity)
    send(Signal.playerReady)
    send(Signal.chgPlayerStage)
  } else if (_evt.uiControlGroupIndex == btn_viewRules) {
    gstsServerMarkViewingRules(_evt.eventSourceEntity as entity, true)
    send(Signal.chgPlayerStage)
  } else if (_evt.uiControlGroupIndex == btn_viewRulesInGame) {
    gstsServerMarkViewingRules(_evt.eventSourceEntity as entity, false)
    send(Signal.chgPlayerStage)
  } else if (_evt.uiControlGroupIndex == btn_showLike) {
    send(Signal.showLike)
  } else if (_evt.uiControlGroupIndex == btn_exitGame) {
    send(Signal.ExitGame)
    gstsServerConfirmSettleFromLegacyExit()
  }
})

g.server({
  id: GraphId.stagePanel
}).on('whenFloatingInteractionPageIsTriggered', (_evt, _f) => {
  if (
    _evt.interactiveItemIndex == btn_closeRulePage ||
    _evt.interactiveItemIndex == btn_closeRulePageLegacy
  ) {
    gstsServerRestoreTitleAfterRulePage(_evt.playerEntity)
    gstsServerMarkNotReadyAfterRulePage(_evt.playerEntity as entity)
    send(Signal.chgPlayerStage)
  }
})

g.server({
  id: GraphId.stagePanel
}).onSignal(Signal.chgPlayerStage, (_evt, _f) => {
  gstsServerSyncOpponentStageState(_evt.signalSourceEntity as entity)
})

g.server({
  id: GraphId.stagePanel
}).onSignal(Signal.ExitGame, (_evt, _f) => {
  gstsServerMarkOpponentExitFromSignal(_evt.signalSourceEntity as entity)
  gstsServerShowOpponentLeftPrompt(_evt.signalSourceEntity as entity)
})

g.server({
  id: GraphId.stagePanel
}).onSignal(Signal.showLike, (_evt, _f) => {
  gstsServerAddLikeScore(_evt.signalSourceEntity as entity)
})
