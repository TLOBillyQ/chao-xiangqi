import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'
import {
  GlobalTimer_BlackCountdown,
  GlobalTimer_RedCountdown,
  timersId
} from '../../contracts/timers'
import { gstsServerErrorMsg as ErrorMsg } from '../ui/broadcastUi'

/**
 * 首回合必须由代码统一初始化，不能依赖编辑器模板里 stage.curPlayer / 玩家 isControl 的默认值。
 * 试玩可选择以 player1 或 player2 进入；单人试玩时在场玩家列表可能只有红方或只有黑方。
 * 因此：双人在场时红方先手；单人试玩时谁在场就先让谁可操作，避免把控制权切给缺席玩家。
 */
export function gstsServerInitializeFirstTurnIfNeeded() {
  let StageEntity = getServerStageEntity()
  let turnInitialized = StageEntity.get('turnInitialized').asType('bool')

  if (!turnInitialized) {
    let players = gsts.f.getListOfPlayerEntitiesOnTheField()
    if (players.length > 0) {
      let redPlayer = players[0] as entity
      let blackPlayer = players[0] as entity
      let hasRedPlayer = false
      let hasBlackPlayer = false

      for (let i = 0; i < players.length; i++) {
        players[i].set('isControl', false)
        players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
        players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.Off)

        if (gsts.f.queryEntityFaction(players[i]) == factionRed) {
          redPlayer = players[i] as entity
          hasRedPlayer = true
        } else if (gsts.f.queryEntityFaction(players[i]) == factionBlack) {
          blackPlayer = players[i] as entity
          hasBlackPlayer = true
        }
      }

      let targetPlayer = redPlayer
      let targetIsRed = true
      let hasTargetPlayer = false

      if (hasRedPlayer) {
        targetPlayer = redPlayer
        targetIsRed = true
        hasTargetPlayer = true
      } else if (hasBlackPlayer) {
        targetPlayer = blackPlayer
        targetIsRed = false
        hasTargetPlayer = true
      }

      if (hasTargetPlayer) {
        StageEntity.set('curPlayer', targetPlayer)
        StageEntity.set('canChange', true)
        StageEntity.set('turnInitialized', true)
        targetPlayer.set('isControl', true)

        if (targetIsRed) {
          for (let i = 0; i < players.length; i++) {
            players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.On)
          }
          gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_BlackCountdown, -999)
          gsts.f.startGlobalTimer(StageEntity, GlobalTimer_RedCountdown)
        } else {
          for (let i = 0; i < players.length; i++) {
            players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.On)
          }
          gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_RedCountdown, -999)
          gsts.f.startGlobalTimer(StageEntity, GlobalTimer_BlackCountdown)
        }
      }
    }
  }
}

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
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()

  if (players.length > 0) {
    let redPlayer = players[0] as entity
    let blackPlayer = players[0] as entity
    let hasRedPlayer = false
    let hasBlackPlayer = false

    for (let i = 0; i < players.length; i++) {
      if (gsts.f.queryEntityFaction(players[i]) == factionRed) {
        redPlayer = players[i] as entity
        hasRedPlayer = true
      } else if (gsts.f.queryEntityFaction(players[i]) == factionBlack) {
        blackPlayer = players[i] as entity
        hasBlackPlayer = true
      }
    }

    let targetPlayer = redPlayer
    let targetIsRed = true
    let hasTargetPlayer = false

    if (Faction == factionRed) {
      if (hasBlackPlayer) {
        targetPlayer = blackPlayer
        targetIsRed = false
        hasTargetPlayer = true
      } else if (hasRedPlayer) {
        targetPlayer = redPlayer
        targetIsRed = true
        hasTargetPlayer = true
      }
    } else {
      if (hasRedPlayer) {
        targetPlayer = redPlayer
        targetIsRed = true
        hasTargetPlayer = true
      } else if (hasBlackPlayer) {
        targetPlayer = blackPlayer
        targetIsRed = false
        hasTargetPlayer = true
      }
    }

    if (canChange && hasTargetPlayer) {
      if (targetIsRed) {
        for (let i = 0; i < players.length; i++) {
          ErrorMsg(
            '<color=#FF0000>红方回合</color>',
            players[i] as entity,
            gsts.f.queryEntityFaction(players[i]) == factionRed
          )
        }
      } else {
        for (let i = 0; i < players.length; i++) {
          ErrorMsg(
            '<color=#000000>黑方回合</color>',
            players[i] as entity,
            gsts.f.queryEntityFaction(players[i]) == factionBlack
          )
        }
      }

      for (let i = 0; i < players.length; i++) {
        players[i].set('isControl', false)
        if (Faction == factionRed) {
          players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
        } else {
          players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.Off)
        }
      }

      StageEntity.set('canChange', false)
      StageEntity.set('turnInitialized', true)
      if (Faction == factionRed) {
        gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_RedCountdown, -999)
      } else {
        gsts.f.modifyGlobalTimer(StageEntity, GlobalTimer_BlackCountdown, -999)
      }

      setTimeout((_e) => {
        StageEntity.set('canChange', true)
        targetPlayer.set('isControl', true)
        let livePlayers = gsts.f.getListOfPlayerEntitiesOnTheField()
        if (targetIsRed) {
          for (let i = 0; i < livePlayers.length; i++) {
            livePlayers[i].setUiControlStatus(timersId.red, UIControlGroupStatus.On)
          }
          StageEntity.set('curPlayer', targetPlayer)
          gsts.f.startGlobalTimer(StageEntity, GlobalTimer_RedCountdown)
        } else {
          for (let i = 0; i < livePlayers.length; i++) {
            livePlayers[i].setUiControlStatus(timersId.black, UIControlGroupStatus.On)
          }
          StageEntity.set('curPlayer', targetPlayer)
          gsts.f.startGlobalTimer(StageEntity, GlobalTimer_BlackCountdown)
        }
      }, 2000)
    }
  }
}
