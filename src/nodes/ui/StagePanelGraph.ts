import { g } from 'genshin-ts/runtime/core'

import * as UIControl from '../../contracts/editorIds'
import { Signal } from '../../resources/signals'
import {
  gstsServerSetOpponentExited,
  gstsServerSetOpponentStageFromSignal,
  gstsServerShowLikeFromSignal,
  gstsServerSimulateOpponentExit,
  gstsServerToggleReady,
  gstsServerViewRules
} from '../../systems/ui/stagePanelUi'

/**
 * 历史图 `_GSTS_StagePanel`(1073741847) 同 ID 接管。玩家实体挂载（界面控件组触发为玩家专属事件）。
 * 见 docs/adr/0002-historical-graph-same-id-takeover.md、recovered/orphan-nodegraphs/TAKEOVER_CHECKLIST.md。
 *
 * 与 ControlUISign 的 changeDir(1844) 分工：1844 管同按钮的相机/方向，本图管准备状态/对手状态/退出结算。
 * 结算对齐原版：退出/结算按钮 = Settle_Stage + ExitGame（不走已废的 settlement.ts ConfirmSettle）。
 */
g.server({ id: 1073741847, name: 'StagePanel' }).on('whenUiControlGroupIsTriggered', (_evt, _f) => {
  //注入版本戳：每次交互写一次，供「切换视角」dump 确认 TS 接管生效（旧编辑器版不会写）
  self.set('gstsTakeoverStagePanel', '1847-v1')
  //用「组合索引」(uiControlGroupCompositeIndex / 原图 data-out:2) 而非 uiControlGroupIndex(data-out:3)：
  //这些按钮在编辑器里属同一多控件组合，组合索引每控件唯一；用 GroupIndex 时「模拟退出」会撞到 exit/settle 的组 ID 而误结算。
  if (
    _evt.uiControlGroupCompositeIndex == UIControl.btn_Ready ||
    _evt.uiControlGroupCompositeIndex == UIControl.btn_reGame
  ) {
    gstsServerToggleReady(self)
    send(Signal.playerReady)
  } else if (_evt.uiControlGroupCompositeIndex == UIControl.btn_showLike) {
    send(Signal.showLike)
  } else if (
    _evt.uiControlGroupCompositeIndex == UIControl.btn_viewRules ||
    _evt.uiControlGroupCompositeIndex == UIControl.btn_viewRulesInGame
  ) {
    gstsServerViewRules(self)
  } else if (
    _evt.uiControlGroupCompositeIndex == UIControl.btn_exitGame ||
    _evt.uiControlGroupCompositeIndex == UIControl.btn_settle
  ) {
    gsts.f.settleStage()
    send(Signal.ExitGame)
  } else if (_evt.uiControlGroupCompositeIndex == UIControl.btn_simulateExit) {
    gstsServerSimulateOpponentExit(self)
  }
})

//对方点赞：随机播点赞动效（发送方在上面的 btn_showLike 分支）
g.server({ id: 1073741847 }).onSignal(Signal.showLike, (_evt, _f) => {
  gstsServerShowLikeFromSignal(self, _evt.eventSourceEntity as typeof self)
})

//对方准备/看规则/取消状态变化：刷新本方「对方玩家状态」文案（chgPlayerStage 由 playerCreate 周期发送）
g.server({ id: 1073741847 }).onSignal(Signal.chgPlayerStage, (_evt, _f) => {
  gstsServerSetOpponentStageFromSignal(self, _evt.eventSourceEntity as typeof self)
})

//对方退出：本方「对方玩家状态」置为「对方已退出游戏」
g.server({ id: 1073741847 }).onSignal(Signal.ExitGame, (_evt, _f) => {
  gstsServerSetOpponentExited(self, _evt.eventSourceEntity as typeof self)
})
