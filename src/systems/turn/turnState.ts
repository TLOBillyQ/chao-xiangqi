import { entity } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { getServerStageEntity, MatchPhase, TurnPhase } from '../../contracts/stage'
import { StageVar } from '../../contracts/variables'
import { gstsServerApplyTurn } from '../stage/matchLifecycle'
import { gstsServerErrorMsg as ErrorMsg } from '../ui/broadcastUi'

/**
 * 回合推进 helper（ADR-0003 后降级）。开局/首回合判定（可开局闸 + 首发选择）与 isControl/UI/倒计时投射已
 * 上移 systems/stage/matchLifecycle。本文件只留：回合切换 switchTurn、棋子静止检测、移动列表维护、可操作闸 canControl。
 */

/**
 * 实时检测棋子状态：moveList 内棋子速度衰减到阈值即移除；清空时触发回合切换。
 */
export function gstsServerCheckPieceMovementState() {
  let moveList = self.get(StageVar.moveList).asType('entity_list')
  for (let i = 0; i < moveList.length; i++) {
    if (Vector3.Magnitude(moveList[i].get('moveVec').asType('vec3')) < 0.1) {
      gsts.f.removeValueFromList(moveList, i)
      self.set(StageVar.moveList, moveList)
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

  let moveList = stage.get(StageVar.moveList).asType('entity_list')
  // eslint-disable-next-line gsts/list-method-type-constraints
  if (!moveList.includes(moveEntity)) {
    // eslint-disable-next-line gsts/list-method-type-constraints
    moveList.push(moveEntity)
  }
  stage.set(StageVar.moveList, moveList)
}

export function gstsServerCanControl(): number {
  let isCan = 1
  let stage = getServerStageEntity()
  let moveList = stage.get(StageVar.moveList).asType('entity_list')

  if (moveList.length > 0) {
    isCan = 0
  }

  return isCan
}

/**
 * 回合切换（PLAYING-ACTIVE → 对手）。守门 matchPhase==PLAYING && turnPhase==ACTIVE（取代 canChange：
 * 防 HANDOFF 2s 窗口内重入、防 LOBBY 期误切）。流程：播报回合 banner（立即）→ 进 HANDOFF + applyTurn
 * （锁控、两方倒计时全压）→ 2s 后切 curPlayer + 回 ACTIVE + applyTurn（授对手 + 起其方倒计时）。
 * curPlayer 沿用原语义在 2s 后才切（HANDOFF 期 applyTurn 不读 curPlayer，零行为漂移）；
 * isControl/UI 控件组/倒计时全部交 applyTurn，本函数不再直接散写。
 */
export function gstsServerSwitchTurn() {
  let stage = getServerStageEntity()
  let playerEntity = stage.get(StageVar.curPlayer).asType('entity')
  let Faction = gsts.f.queryEntityFaction(playerEntity)
  let canSwitch =
    stage.get(StageVar.matchPhase).asType('float') == MatchPhase.PLAYING &&
    stage.get(StageVar.turnPhase).asType('float') == TurnPhase.ACTIVE
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()

  if (players.length > 0 && canSwitch) {
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

    if (hasTargetPlayer) {
      //回合 banner 立即播报（D8：留此，不进 applyTurn——开局首回合不播报，保持与历史图 1849 一致）
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

      //进 HANDOFF：锁控 + 压双方倒计时（curPlayer 暂不动，沿用原 2s 后切语义）
      stage.set(StageVar.turnPhase, TurnPhase.HANDOFF)
      gstsServerApplyTurn()

      //2s 后切 curPlayer 并回 ACTIVE，applyTurn 授对手控制权 + 起其方倒计时
      setTimeout((_e) => {
        let s = getServerStageEntity()
        //双发防护：节点图计时器池每次调度回调触发两次（local 日志实测 8 次调度→16 次回调，恰 2.0×）。
        //仅当仍处 HANDOFF 时执行切换并原子清 HANDOFF；第二次回调见 ACTIVE 即空跑，
        //杜绝把控制权二次翻面（=「播报红方回合→红方选不中→瞬切黑方」的真凶）。
        if (s.get(StageVar.turnPhase).asType('float') == TurnPhase.HANDOFF) {
          s.set(StageVar.curPlayer, targetPlayer)
          s.set(StageVar.turnPhase, TurnPhase.ACTIVE)
          gstsServerApplyTurn()
        }
      }, 2000)
    }
  }
}
