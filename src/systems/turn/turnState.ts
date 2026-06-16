import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity } from 'genshin-ts/runtime/value'

import { factionRed } from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'
import {
  GlobalTimer_BlackCountdown,
  GlobalTimer_RedCountdown,
  timersId
} from '../../contracts/timers'
import { gstsServerErrorMsg as ErrorMsg } from '../ui/broadcastUi'

/**
 * 实时检测棋子状态
 */
export function gstsServerCheckPieceMovementState() {
  let moveList = self.get('moveList').asType('entity_list')
  for (let i = 0; i < moveList.length; i++) {
    if (Vector3.Magnitude(moveList[i].get('moveVec').asType('vec3')) < 0.1) {
      gsts.f.removeValueFromList(moveList, i)
      self.set('moveList', moveList)
      if (moveList.length <= 0) gstsServerSwitchTurn()
      break
    }
  }
}

/**
 * 往移动列表里添加移动中的实体
 * @param moveEntity
 */
export function gstsServerAddMoveEntity(moveEntity: entity) {
  let stage = getServerStageEntity()

  let moveList = stage.get('moveList').asType('entity_list')
  // eslint-disable-next-line gsts/list-method-type-constraints
  if (!moveList.includes(moveEntity)) {
    // eslint-disable-next-line gsts/list-method-type-constraints
    moveList.push(moveEntity)
  }
  stage.set('moveList', moveList)
}

export function gstsServerCanControl(): number {
  let isCan = 1
  let stage = getServerStageEntity()
  let moveList = stage.get('moveList').asType('entity_list')

  if (moveList.length > 0) {
    isCan = 0
  }

  return isCan
}

export function gstsServerSwitchTurn() {
  let StageEntity = getServerStageEntity()
  let playerEntity = StageEntity.get('curPlayer').asType('entity')
  let Faction = gsts.f.queryEntityFaction(playerEntity)
  let canChange = StageEntity.get('canChange').asType('bool')

  if (Faction == factionRed) {
    if (canChange) {
      ErrorMsg('<color=#000000>黑方回合</color>', player(1) as entity, false)
      ErrorMsg('<color=#000000>黑方回合</color>', player(2) as entity, true)
      player(1).setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
      player(2).setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
      //启动黑方倒计时
      //切换保护 避免短时间内频繁切换导致错误
      StageEntity.set('canChange', false)
      playerEntity.set('isControl', false)
      gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_RedCountdown, -999)
      setTimeout((_e) => {
        StageEntity.set('canChange', true)
        player(2).set('isControl', true)
        player(1).setUiControlStatus(timersId.black, UIControlGroupStatus.On)
        player(2).setUiControlStatus(timersId.black, UIControlGroupStatus.On)
        StageEntity.set('curPlayer', player(2))
        gsts.f.startGlobalTimer(StageEntity, GlobalTimer_BlackCountdown)
      }, 2000)
    }
  } else {
    if (canChange) {
      ErrorMsg('<color=#FF0000>红方回合</color>', player(1) as entity, true)
      ErrorMsg('<color=#FF0000>红方回合</color>', player(2) as entity, false)

      player(1).setUiControlStatus(timersId.black, UIControlGroupStatus.Off)
      player(2).setUiControlStatus(timersId.black, UIControlGroupStatus.Off)
      //启动红方倒计时
      StageEntity.set('canChange', false)
      playerEntity.set('isControl', false)
      gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_BlackCountdown, -999)
      //切换保护 避免短时间内频繁切换导致错误

      setTimeout((_e) => {
        StageEntity.set('canChange', true)
        player(1).set('isControl', true)
        player(1).setUiControlStatus(timersId.red, UIControlGroupStatus.On)
        player(2).setUiControlStatus(timersId.red, UIControlGroupStatus.On)
        StageEntity.set('curPlayer', player(1))
        gsts.f.startGlobalTimer(StageEntity, GlobalTimer_RedCountdown)
      }, 2000)
    }
  }
}
