import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerLabelPlayerPosition } from '../../systems/ui/positionNameplate'

g.server({
  id: 1073741828,
  name: 'playerCreated'
}).on('whenEntityIsCreated', (_evt, f) => {
  let _entity = self
  //标题是否被「查看规则」隐藏：先初始化，保证规则页关闭事件里 get 可用
  self.set('titleHiddenByRule', false)
  //当前对局视角是否为垂直：默认 true（点「准备」进入对局即用垂直），「切换视角」在 垂直/斜45 间来回切
  self.set('isVerticalCam', true)
  //玩家创建时先关闭操控权；首回合由 stage 统一按红方初始化，避免玩家模板默认值让黑方抢先操作
  self.set('isControl', false)
  self.set('ischarge', false)
  self.set('chargePower', 0)
  self.set('curDirIndex', 999)
  self.set('curChessType', '')
  //对方玩家昵称：先占位空串保证变量存在，双方满员后由 gstsServerSyncOpponentNicknames 互写
  self.set('对方玩家昵称', '')
  self.set('curChooseChess', self)
  self.set('ScanEntity', self)
  self.set('step', 0)
  f.startTimer(self, 'sendCurStageToOther', true, [3])
  //初始化镜头：准备阶段用准备相机（实体「镜头」GUID 1077936985 上的物件镜头条目「准备镜头」）
  f.setPlayerCameraToFollowEntity(self, f.queryEntityByGuid(1077936985n), '准备镜头')
  f.activateDisableModelDisplay(self.character, false)
  //进场即把本玩家昵称写进其阵营对应的「玩家位置」底座物件，供其铭牌文本框 {1:s.玩家昵称} 显示（单次，不走 tick）
  gstsServerLabelPlayerPosition(self)
})

g.server({
  id: 1073741828
}).on('whenTimerIsTriggered', (_evt, _f) => {
  send(Signal.chgPlayerStage)
})
