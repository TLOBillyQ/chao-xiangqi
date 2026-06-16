import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { g } from 'genshin-ts/runtime/core'

import { EntityTag, factionRed } from '../../Global'
import { Signal } from '../../resources/signals'
import { gstsServerConfirmSettle } from '../../settlement/settleFunction'
import * as UIControl from '../../UIControlGroupId'

g.server({
  id: 1073741841,
  name: 'ControlUI'
}).onSignal(Signal.ControlUI, (_evt, f) => {
  //需要手动修改传入目标
  let targetentity = f.getSelfEntity()
  let enteringTag = f.getEntityUnitTagList(targetentity)[0]
  if (enteringTag == EntityTag.Dir) {
    self.setUiControlStatus(1073741840n, UIControlGroupStatus.On)
  } else {
    self.setUiControlStatus(1073741840n, UIControlGroupStatus.Off)
  }
})

g.server({
  id: 1073741844,
  name: 'changeDir'
}).on('whenUiControlGroupIsTriggered', (_evt, _f) => {
  // 点击「结算」按钮 → 真正结算；「查看规则」→ 隐藏标题；左右按钮 → 切换方向。
  if (_evt.uiControlGroupIndex == UIControl.btn_settle) {
    gstsServerConfirmSettle()
  } else if (_evt.uiControlGroupIndex == UIControl.btn_viewRules) {
    // 规则交互页由编辑器侧配置打开，这里负责隐藏开局 UI，避免盖在规则页上：
    // 标题及其动效成员关闭；三个按钮组用 Hidden（按钮样式内嵌动效层级恒在规则页之上，
    // 必须整组隐藏才能带走动效；Hidden 保留按钮状态，恢复时不重置准备中/开始状态）
    _evt.eventSourceEntity.setUiControlStatus(UIControl.ui_titleFx1, UIControlGroupStatus.Off)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.ui_titleFxFull, UIControlGroupStatus.Off)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.ui_titleFx2, UIControlGroupStatus.Off)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.ui_title, UIControlGroupStatus.Off)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.btn_Ready, UIControlGroupStatus.Hidden)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.ui_enemyInfo, UIControlGroupStatus.Hidden)
    _evt.eventSourceEntity.setUiControlStatus(UIControl.btn_viewRules, UIControlGroupStatus.Hidden)
    _evt.eventSourceEntity.set('titleHiddenByRule', true)
  } else if (
    _evt.uiControlGroupIndex == UIControl.btn_Ready ||
    _evt.uiControlGroupIndex == UIControl.btn_reGame
  ) {
    //点「准备」或「再来一局/重开」进入对局：默认切到垂直视角
    //本事件只有触发交互的玩家节点图能收到，故 self 即点击的玩家；
    //对局镜头按玩家区分：玩家1(红)=镜头1(1077937005)，玩家2(黑)=镜头2(1077937034)，条目同名「垂直」「斜45」
    self.set('isVerticalCam', true)
    let camGuid = 1077937034n
    if (_f.queryEntityFaction(self) == factionRed) camGuid = 1077937005n
    _f.setPlayerCameraToFollowEntity(self, _f.queryEntityByGuid(camGuid), '垂直')
  } else if (_evt.uiControlGroupIndex == UIControl.btn_switchCamera) {
    //「切换视角」：进行中在 垂直 / 斜45 间来回切（同一玩家镜头实体上的两个同名条目）
    //对局镜头按玩家区分：玩家1(红)=镜头1(1077937005)，玩家2(黑)=镜头2(1077937034)
    let toVertical = !self.get('isVerticalCam').asType('bool')
    self.set('isVerticalCam', toVertical)
    let camGuid = 1077937034n
    if (_f.queryEntityFaction(self) == factionRed) camGuid = 1077937005n
    if (toVertical) {
      _f.setPlayerCameraToFollowEntity(self, _f.queryEntityByGuid(camGuid), '垂直')
    } else {
      _f.setPlayerCameraToFollowEntity(self, _f.queryEntityByGuid(camGuid), '斜45')
    }
  } else if (
    _evt.uiControlGroupCompositeIndex == UIControl.changeDir.left ||
    _evt.uiControlGroupCompositeIndex == UIControl.changeDir.right
  ) {
    let controlEntity = _evt.eventSourceEntity
    const curChooseChessType = controlEntity.get('curChessType').asType('str')
    let curDirIndex = controlEntity.get('curDirIndex').asType('float')

    let dirList = UIControl.dirContrlId.车
    if (curChooseChessType == '马') dirList = UIControl.dirContrlId.马
    else if (curChooseChessType === '炮') dirList = UIControl.dirContrlId.炮
    else if (curChooseChessType === '象') dirList = UIControl.dirContrlId.象
    else if (curChooseChessType === '士') dirList = UIControl.dirContrlId.士
    else if (curChooseChessType === '帅') dirList = UIControl.dirContrlId.帅
    else if (curChooseChessType === '兵') dirList = UIControl.dirContrlId.兵
    else if (curChooseChessType === '兵过河') dirList = UIControl.dirContrlId.兵过河

    let newIndex = curDirIndex
    controlEntity.setUiControlStatus(dirList[idx(int(curDirIndex))], UIControlGroupStatus.Off)
    if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.left) {
      newIndex = curDirIndex - 1
      let length = Number(dirList.length)
      if (newIndex < 0) newIndex = length - 1
    } else if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.right) {
      newIndex = curDirIndex + 1
      let length = Number(dirList.length)
      if (newIndex > length - 1) newIndex = 0
    }

    controlEntity.set('curDirIndex', newIndex)
    controlEntity.setUiControlStatus(dirList[idx(int(newIndex))], UIControlGroupStatus.On)
  }
})

g.server({
  id: 1073741844,
  name: 'rulePageInteraction'
}).on('whenFloatingInteractionPageIsTriggered', (_evt, _f) => {
  // 点关闭按钮收起规则页时，若标题是被「查看规则」隐藏的则恢复显示
  // （局内查看规则同样会经过这里，但标记为 false，不会误把开局标题弹出来）
  if (_evt.interactiveItemIndex == UIControl.btn_closeRulePage) {
    let conPlayer = _evt.playerEntity
    if (conPlayer.get('titleHiddenByRule').asType('bool')) {
      conPlayer.setUiControlStatus(UIControl.ui_title, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.ui_titleFx1, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.ui_titleFxFull, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.ui_titleFx2, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.btn_Ready, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.ui_enemyInfo, UIControlGroupStatus.On)
      conPlayer.setUiControlStatus(UIControl.btn_viewRules, UIControlGroupStatus.On)
      conPlayer.set('titleHiddenByRule', false)
    }
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
