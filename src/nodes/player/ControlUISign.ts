import { g } from 'genshin-ts/runtime/core'

import * as UIControl from '../../contracts/editorIds'
import { Signal } from '../../resources/signals'
import {
  gstsServerSwitchToVerticalCamera,
  gstsServerToggleBattleCamera
} from '../../systems/ui/cameraUi'
import {
  gstsServerSwitchDirectionUI,
  gstsServerToggleDirControlByTag
} from '../../systems/ui/directionUi'
import {
  gstsServerHideTitleForRulePage,
  gstsServerRestoreTitleAfterRulePage
} from '../../systems/ui/rulePageUi'

g.server({
  id: 1073741841,
  name: 'ControlUI'
}).onSignal(Signal.ControlUI, (_evt, f) => {
  //需要手动修改传入目标
  let targetentity = f.getSelfEntity()
  gstsServerToggleDirControlByTag(targetentity)
})

g.server({
  id: 1073741844,
  name: 'changeDir'
}).on('whenUiControlGroupIsTriggered', (_evt, _f) => {
  //btn_settle 的结算职责已移交 StagePanel(1847)：Settle_Stage + ExitGame（对齐原版）。本图只管相机/方向/标题。
  if (_evt.uiControlGroupIndex == UIControl.btn_viewRules) {
    gstsServerHideTitleForRulePage(_evt.eventSourceEntity)
  } else if (
    _evt.uiControlGroupIndex == UIControl.btn_Ready ||
    _evt.uiControlGroupIndex == UIControl.btn_reGame
  ) {
    gstsServerSwitchToVerticalCamera(_evt.eventSourceEntity as typeof self)
  } else if (_evt.uiControlGroupIndex == UIControl.btn_switchCamera) {
    gstsServerToggleBattleCamera(_evt.eventSourceEntity as typeof self)
  } else if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.left) {
    gstsServerSwitchDirectionUI(_evt.eventSourceEntity, true)
  } else if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.right) {
    gstsServerSwitchDirectionUI(_evt.eventSourceEntity, false)
  }
})

g.server({
  id: 1073741844,
  name: 'rulePageInteraction'
}).on('whenFloatingInteractionPageIsTriggered', (_evt, _f) => {
  if (_evt.interactiveItemIndex == UIControl.btn_closeRulePage) {
    gstsServerRestoreTitleAfterRulePage(_evt.playerEntity)
  }
})

g.server({
  id: 1073741844,
  name: 'chargeSkillInput'
}).on('whenSkillNodeIsCalled', (_evt, _f) => {
  let callerPlayer = _evt.callerEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if (callerPlayer == self) {
    if (_evt.parameter1 == 'BeginCharge') send(Signal.BeginCharge)
    else if (_evt.parameter1 == 'StopCharge') send(Signal.StopCharge)
  }
})
