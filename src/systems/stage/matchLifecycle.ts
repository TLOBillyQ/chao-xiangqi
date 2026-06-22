import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { getServerStageEntity, MatchPhase, TurnPhase } from '../../contracts/stage'
import {
  GlobalTimer_BlackCountdown,
  GlobalTimer_RedCountdown,
  Tick_CheckChessMove,
  Tick_PlayerExit,
  timersId
} from '../../contracts/timers'
import { PlayerVar, StageVar } from '../../contracts/variables'
import {
  gstsServerClearBoard,
  gstsServerPlacePieces,
  gstsServerSetupReadyPlayers
} from './readyToPlay'

/**
 * 对局生命周期单一所有者（ADR-0003）。把原先散落的「开局闸/回合闸/生命周期码」收敛为两轴状态机：
 *   matchPhase（关卡 float）：LOBBY ⇄ PLAYING —— 取代 GameStage(1/2/3) + turnInitialized
 *   turnPhase（仅 PLAYING 内有意义）：ACTIVE ⇄ HANDOFF —— 取代 canChange
 * isControl 不再独立置位，而是 applyTurn 的派生投影（扫描图仍按玩家变量读取）。
 */

/**
 * 唯一可开局谓词：全员已准备（玩家状态==1）且在场人数 >= 理论入局人数（playerCount）。
 * 取代过去「全员已准备」（仅摆子）与「满员+已准备」（仅授控制权）两套互相分歧的判定。
 */
export function gstsServerCanStartMatch(): boolean {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let allReady = true
  for (let i = 0; i < players.length; i++) {
    if (players[i].get(PlayerVar.playerStage).asType('float') != 1) {
      allReady = false
    }
  }
  //quorum 与 players.length 必须同为 gsts int：playerCount 本就是 int(bigint)，players.length 用 int() 桥接（TS number→bigint）。
  //勿用 float() 转 quorum——gsts get_list_length 输出 int，与 float 比较会触发 greaterThanOrEqualTo 泛型不匹配（build 实测）。
  let quorum = gsts.f.queryGameModeAndPlayerNumber().playerCount
  return allReady && int(players.length) >= quorum
}

/**
 * 原子开局 LOBBY→PLAYING。幂等闸 matchPhase==LOBBY（取代 turnInitialized）；唯一开局触发点（ReadyToPlayGraph 的 playerReady）。
 * 顺序硬约束（ADR-0003 R1）：清场 removeEntity 必须在 matchPhase 仍为 LOBBY 时发生（否则销毁链误报出界），故置 PLAYING 排在摆盘之后。
 */
export function gstsServerStartMatchIfReady() {
  let stage = getServerStageEntity()
  //版本戳（写关卡实体，供「切换视角」dump 确认 TS 接管生效）。原 readyToPlay:33 上移至此。
  stage.set('gstsTakeoverReadyToPlay', '1849-v2')
  if (stage.get(StageVar.matchPhase).asType('float') == MatchPhase.LOBBY) {
    if (gstsServerCanStartMatch()) {
      gstsServerSetupReadyPlayers()
      gstsServerClearBoard()
      gstsServerPlacePieces()
      stage.set(StageVar.matchPhase, MatchPhase.PLAYING)
      //首发：红先手；单人缺红回退黑（镜像旧 InitializeFirstTurnIfNeeded 的受支持行为）
      let players = gsts.f.getListOfPlayerEntitiesOnTheField()
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
      let hasTargetPlayer = false
      if (hasRedPlayer) {
        targetPlayer = redPlayer
        hasTargetPlayer = true
      } else if (hasBlackPlayer) {
        targetPlayer = blackPlayer
        hasTargetPlayer = true
      }
      if (hasTargetPlayer) {
        stage.set(StageVar.curPlayer, targetPlayer)
        stage.set(StageVar.turnPhase, TurnPhase.ACTIVE)
        gstsServerApplyTurn()
      }
      //5s 循环退出探测（原 readyToPlay:47）
      gsts.f.startTimer(stage, Tick_PlayerExit, true, [5])
    }
  }
}

/**
 * 单一回合投射（ADR-0003 决策4）：据 (matchPhase, turnPhase, curPlayer) 遍历全员统一写
 * isControl + 该阵营 UI 控件组开关 + 该方倒计时。是 isControl 的唯一投射点。
 * 登记豁免（不归本函数）：playerCreate（LOBBY 默认 false）、launch/StopCharge（发射即时锁）。
 * 非 PLAYING-ACTIVE（含 HANDOFF / LOBBY）一律：全员 isControl=false、两组 UI 控件全关、两方倒计时全压。
 */
export function gstsServerApplyTurn() {
  let stage = getServerStageEntity()
  let phase = stage.get(StageVar.matchPhase).asType('float')
  let tphase = stage.get(StageVar.turnPhase).asType('float')
  let cur = stage.get(StageVar.curPlayer).asType('entity')
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let active = phase == MatchPhase.PLAYING && tphase == TurnPhase.ACTIVE
  let curIsRed = false
  if (active) {
    curIsRed = gsts.f.queryEntityFaction(cur) == factionRed
  }
  for (let i = 0; i < players.length; i++) {
    //当前方判定必须用【阵营】而非 entity==：curPlayer 经 set/get 往返读回，与 fresh query 的 players[i] 是不同句柄、== 恒 false
    //（局内实测：回合切到红方后红方拿不到控制权、干等倒计时归零又切回）。一方一阵营，同阵营即当前方。
    let isCur = false
    if (active) {
      if (curIsRed) {
        if (gsts.f.queryEntityFaction(players[i]) == factionRed) isCur = true
      } else {
        if (gsts.f.queryEntityFaction(players[i]) == factionBlack) isCur = true
      }
    }
    players[i].set(PlayerVar.isControl, isCur)
    if (active && curIsRed) {
      players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.On)
      players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.Off)
    } else if (active) {
      players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
      players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.On)
    } else {
      players[i].setUiControlStatus(timersId.red, UIControlGroupStatus.Off)
      players[i].setUiControlStatus(timersId.black, UIControlGroupStatus.Off)
    }
  }
  if (active && curIsRed) {
    gsts.f.modifyGlobalTimer(stage, GlobalTimer_BlackCountdown, -999)
    gsts.f.startGlobalTimer(stage, GlobalTimer_RedCountdown)
  } else if (active) {
    gsts.f.modifyGlobalTimer(stage, GlobalTimer_RedCountdown, -999)
    gsts.f.startGlobalTimer(stage, GlobalTimer_BlackCountdown)
  } else {
    gsts.f.modifyGlobalTimer(stage, GlobalTimer_RedCountdown, -999)
    gsts.f.modifyGlobalTimer(stage, GlobalTimer_BlackCountdown, -999)
  }
}

/**
 * rematch：PLAYING→LOBBY（ADR-0003 决策7 / R1）。先置 LOBBY，再 applyTurn（LOBBY 下全员锁控、两方倒计时全压），
 * 然后清 moveList（pause/clear/resume 三明治）与重置剩余棋子。吸收原 chessDestroy.gstsServerResetForRematch 的生命周期部分；
 * 出界播报三队列的清理仍留在 chessDestroy（其独有职责）。
 */
export function gstsServerResetToLobby() {
  let stage = getServerStageEntity()
  stage.set(StageVar.matchPhase, MatchPhase.LOBBY)
  stage.set(StageVar.turnPhase, TurnPhase.ACTIVE)
  gstsServerApplyTurn()
  gsts.f.pauseTimer(stage, Tick_CheckChessMove)
  let moveList = stage.get(StageVar.moveList).asType('entity_list')
  gsts.f.clearList(moveList)
  stage.set(StageVar.moveList, moveList)
  gsts.f.resumeTimer(stage, Tick_CheckChessMove)
  let p1 = player(1) as typeof self
  let p2 = player(2) as typeof self
  p1.set(PlayerVar.remainPieces, 16n)
  p2.set(PlayerVar.remainPieces, 16n)
}
