import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import * as UIControl from '../../contracts/editorIds'
import { PlayerVar } from '../../contracts/variables'

type UiEntity = Pick<typeof self, 'get' | 'set' | 'setUiControlStatus'>

export function gstsServerHideTitleForRulePage(playerEntity: UiEntity) {
  // 规则交互页由编辑器侧配置打开，这里负责隐藏开局 UI，避免盖在规则页上：
  // 标题及其动效成员关闭；三个按钮组用 Hidden（按钮样式内嵌动效层级恒在规则页之上，
  // 必须整组隐藏才能带走动效；Hidden 保留按钮状态，恢复时不重置准备中/开始状态）
  playerEntity.setUiControlStatus(UIControl.ui_titleFx1, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.ui_titleFxFull, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.ui_titleFx2, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.ui_title, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.btn_Ready, UIControlGroupStatus.Hidden)
  playerEntity.setUiControlStatus(UIControl.ui_enemyInfo, UIControlGroupStatus.Hidden)
  playerEntity.setUiControlStatus(UIControl.btn_viewRules, UIControlGroupStatus.Hidden)
  playerEntity.set(PlayerVar.titleHiddenByRule, true)
}

export function gstsServerRestoreTitleAfterRulePage(playerEntity: UiEntity) {
  // 点关闭按钮收起规则页时，若标题是被「查看规则」隐藏的则恢复显示
  // （局内查看规则同样会经过这里，但标记为 false，不会误把开局标题弹出来）
  if (playerEntity.get(PlayerVar.titleHiddenByRule).asType('bool')) {
    playerEntity.setUiControlStatus(UIControl.ui_title, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.ui_titleFx1, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.ui_titleFxFull, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.ui_titleFx2, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.btn_Ready, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.ui_enemyInfo, UIControlGroupStatus.On)
    playerEntity.setUiControlStatus(UIControl.btn_viewRules, UIControlGroupStatus.On)
    playerEntity.set(PlayerVar.titleHiddenByRule, false)
  }
}
