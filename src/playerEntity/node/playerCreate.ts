import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'

g.server({
  id: 1073741828,
  name: 'playerCreated'
}).on('whenEntityIsCreated', (_evt, f) => {
  let _entity = self
  //标题是否被「查看规则」隐藏：先初始化，保证规则页关闭事件里 get 可用
  self.set('titleHiddenByRule', false)
  //当前对局视角是否为垂直：默认 true（点「准备」进入对局即用垂直），「切换视角」在 垂直/斜45 间来回切
  self.set('isVerticalCam', true)
  f.startTimer(self, 'sendCurStageToOther', true, [3])
  //初始化镜头：准备阶段用准备相机（实体「镜头」GUID 1077936985 上的物件镜头条目「准备镜头」）
  f.setPlayerCameraToFollowEntity(self, f.queryEntityByGuid(1077936985n), '准备镜头')
  f.activateDisableModelDisplay(self.character, false)
})

g.server({
  id: 1073741828
}).on('whenTimerIsTriggered', (_evt, _f) => {
  send(Signal.chgPlayerStage)
})
