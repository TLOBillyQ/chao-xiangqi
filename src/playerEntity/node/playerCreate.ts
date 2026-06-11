import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'

g.server({
  id: 1073741828,
  name: 'playerCreated'
}).on('whenEntityIsCreated', (_evt, f) => {
  let _entity = self
  //标题是否被「查看规则」隐藏：先初始化，保证规则页关闭事件里 get 可用
  self.set('titleHiddenByRule', false)
  //当前是否处于垂直镜头：默认 false（玩家N镜头），「切换视角」按钮按此来回切换
  self.set('isVerticalCam', false)
  f.startTimer(self, 'sendCurStageToOther', true, [3])
  //初始化镜头
  f.setPlayerCameraToFollowEntity(self, f.queryEntityByGuid(1077936985n), '准备镜头')
  f.activateDisableModelDisplay(self.character, false)
})

g.server({
  id: 1073741828
}).on('whenTimerIsTriggered', (_evt, _f) => {
  send(Signal.chgPlayerStage)
})
