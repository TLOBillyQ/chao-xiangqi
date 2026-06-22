import { SettlementStatus, UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { faction } from 'genshin-ts/runtime/value'

import {
  btn_exitGame,
  btn_reGame,
  btn_showLike,
  cameraAnchorGuid,
  env_loseAmbience,
  factionBlack,
  factionRed,
  id_broadList,
  layout_ready,
  ui_broadcastText,
  ui_losePanel,
  ui_outOfBoundsBroadcast,
  ui_winPanel
} from '../../contracts/editorIds'
import { getServerStageEntity, MatchPhase } from '../../contracts/stage'
import { PlayerVar, StageVar } from '../../contracts/variables'
import { gstsServerResetToLobby } from './matchLifecycle'

/**
 * chessDestroy(1073741850) 同 ID 接管的玩法逻辑（挂【关卡实体】，由「实体销毁时」驱动）。
 *
 * 真值见 recovered/orphan-nodegraphs/1073741850_chessDestroy.readable.txt（节点级）。
 * 关键约束：① self/事件源=被销毁棋子，关卡状态一律走 getServerStageEntity()；② 被销毁子的
 * 棋子类型/阵营 从销毁快照读（实体已在销毁，直接 get 可能失效）；③ 将帅死 = 原版 rematch
 * 重置再来一局，不 settleStage（关卡仅由 StagePanel 退出按钮结束）；④ 计时器用 setTimeout，
 * 编译器自动建池；⑤ setPlayerRankScoreChange/switchCurrentInterfaceLayout 等是实体方法，绝不 gsts.f.*。
 */

type PlayerEntity = typeof self

/** 实体销毁时主链：双闸（是棋子 + matchPhase==PLAYING）→ 出界播报；棋子类型=='帅' → rematch。 */
export function gstsServerOnChessDestroyed(
  curPieceType: string,
  curFaction: string,
  deadFaction: faction,
  ownerPlayer: PlayerEntity
) {
  let stage = getServerStageEntity()
  //注入版本戳（写关卡实体，供「切换视角」dump 读取确认 TS 接管生效）
  stage.set('gstsTakeoverChessDestroy', '1850-v1')
  if (curPieceType != '') {
    //ADR-0003 决策5：出界播报仅在 PLAYING 有效（取代 GameStage!=3）；LOBBY 期销毁含 rematch 清场不再误报
    if (stage.get(StageVar.matchPhase).asType('float') == MatchPhase.PLAYING) {
      gstsServerReportOutOfBounds(curFaction, curPieceType, ownerPlayer)
    }
    if (curPieceType == '帅') {
      gstsServerHandleGeneralDeath(deadFaction)
    }
  }
}

/** 出界播报：归属玩家剩余棋子-1；阵营/棋子/剩余 三队列插表头；逐项点亮播报槽；写昵称；定时关播报。 */
export function gstsServerReportOutOfBounds(
  curFaction: string,
  curPieceType: string,
  ownerPlayer: PlayerEntity
) {
  let stage = getServerStageEntity()
  let p1 = player(1) as PlayerEntity
  let p2 = player(2) as PlayerEntity
  let remain = ownerPlayer.get(PlayerVar.remainPieces).asType('int') - 1n
  ownerPlayer.set(PlayerVar.remainPieces, remain)
  //三组出界文案队列：插表头（原图 Insert 默认 index 0）
  let listFaction = stage.get(StageVar.outBroadcastFaction).asType('str_list')
  gsts.f.insertValueIntoList(listFaction, 0n, curFaction)
  stage.set(StageVar.outBroadcastFaction, listFaction)
  let listPiece = stage.get(StageVar.outBroadcastPiece).asType('str_list')
  gsts.f.insertValueIntoList(listPiece, 0n, curPieceType)
  stage.set(StageVar.outBroadcastPiece, listPiece)
  let listRemain = stage.get(StageVar.outBroadcastRemain).asType('str_list')
  gsts.f.insertValueIntoList(listRemain, 0n, str(remain))
  stage.set(StageVar.outBroadcastRemain, listRemain)
  //逐项：非空文案点亮对应播报槽控件（双方各一次）
  for (let i = 0; i < listFaction.length; i++) {
    if (listFaction[i] != '') {
      p1.setUiControlStatus(id_broadList[i], UIControlGroupStatus.On)
      p2.setUiControlStatus(id_broadList[i], UIControlGroupStatus.On)
    }
  }
  stage.set(StageVar.outBroadcasterNick, gsts.f.getPlayerNickname(ownerPlayer))
  p1.setUiControlStatus(ui_outOfBoundsBroadcast, UIControlGroupStatus.On)
  p2.setUiControlStatus(ui_outOfBoundsBroadcast, UIControlGroupStatus.On)
  //原图 Start_Timer 时长列表 [count=1, value=3] → 单个 3 秒定时器
  setTimeout((_e) => {
    p1.setUiControlStatus(ui_outOfBoundsBroadcast, UIControlGroupStatus.Off)
    p2.setUiControlStatus(ui_outOfBoundsBroadcast, UIControlGroupStatus.Off)
  }, 3000)
}

/** 将帅死：输家(死方阵营)切失败面板+扣分+氛围；赢家(对方阵营)切胜利面板+加分；整局重置再来一局。 */
export function gstsServerHandleGeneralDeath(deadFaction: faction) {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  //输家 = 被销毁帅/将的同阵营玩家
  let loser = gsts.f.getEntityListBySpecifiedFaction(players, deadFaction)[0]
  gstsServerSetupPlayerAfterGame(loser, ui_losePanel, -10n)
  gsts.f.modifyEnvironmentSettings(env_loseAmbience, [loser], false, 0)
  //赢家 = 对方阵营
  let winnerFaction = factionBlack
  if (deadFaction == factionRed) {
    winnerFaction = factionBlack
  } else {
    winnerFaction = factionRed
  }
  let winner = gsts.f.getEntityListBySpecifiedFaction(players, winnerFaction)[0]
  gstsServerSetupPlayerAfterGame(winner, ui_winPanel, 20n)
  gstsServerResetForRematch()
}

/** 胜负后玩家公共处理：拉回未准备态、切准备布局/镜头、亮再来一局/胜负面板/退出/点赞、累加并写排位分、关播报文字。 */
export function gstsServerSetupPlayerAfterGame(
  p: PlayerEntity,
  panelControl: bigint,
  scoreDelta: bigint
) {
  p.set(PlayerVar.notReady, true)
  p.set(PlayerVar.playerStage, 3)
  p.switchCurrentInterfaceLayout(layout_ready)
  p.setPlayerCameraToFollowEntity(gsts.f.queryEntityByGuid(cameraAnchorGuid), '准备镜头')
  p.setUiControlStatus(btn_reGame, UIControlGroupStatus.On)
  p.setUiControlStatus(panelControl, UIControlGroupStatus.On)
  p.setUiControlStatus(btn_exitGame, UIControlGroupStatus.On)
  p.setUiControlStatus(btn_showLike, UIControlGroupStatus.On)
  let s = p.get(PlayerVar.curScore).asType('int') + scoreDelta
  p.set(PlayerVar.curScore, s)
  //排位分用「未定」(原图 4100=SettlementStatus_TBC)，rematch 只记分不终局
  p.setPlayerRankScoreChange(SettlementStatus.Undefined, s)
  p.setUiControlStatus(ui_broadcastText, UIControlGroupStatus.Off)
}

/** 整局重置再来一局：生命周期重置（→LOBBY/锁控/压双方倒计时/清 moveList/剩余棋子=16）上移 matchLifecycle.resetToLobby；本图只保留清三出界播报队列。 */
export function gstsServerResetForRematch() {
  let stage = getServerStageEntity()
  //生命周期部分（ADR-0003 决策7 / R1）：先置 LOBBY，再锁控/压双方倒计时/清 moveList/重置剩余棋子
  gstsServerResetToLobby()
  //清三出界播报队列（出界 UI 状态属本图独有职责，不迁 matchLifecycle）
  let listFaction = stage.get(StageVar.outBroadcastFaction).asType('str_list')
  gsts.f.clearList(listFaction)
  stage.set(StageVar.outBroadcastFaction, listFaction)
  let listPiece = stage.get(StageVar.outBroadcastPiece).asType('str_list')
  gsts.f.clearList(listPiece)
  stage.set(StageVar.outBroadcastPiece, listPiece)
  let listRemain = stage.get(StageVar.outBroadcastRemain).asType('str_list')
  gsts.f.clearList(listRemain)
  stage.set(StageVar.outBroadcastRemain, listRemain)
}
