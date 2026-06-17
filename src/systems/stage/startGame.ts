import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity } from 'genshin-ts/runtime/value'

import {
  EntityTag,
  factionRed,
  openingEnvironment,
  openingPresetPoint,
  player1CameraEntityGuid,
  player1CameraEntry,
  player2CameraEntityGuid,
  player2CameraEntry,
  playLayout,
  ui_broadcastFxFull,
  ui_broadcastText
} from '../../contracts/editorIds'
import { chessInterval, firstChessPos, getServerStageEntity, initPos } from '../../contracts/stage'
import { GlobalTimer_RedCountdown, timersId } from '../../contracts/timers'

//Piece 标签的数值形式：EntityTag.Piece(1073741825) 的整型副本，供 createPrefab 的 unitTagIndexList 使用
//（list('int', ...) 在本项目里一律用普通数字字面量，不用 bigint）
const PIECE_TAG_INDEX = 1073741825

/**
 * 开局：忠实复现历史节点图 `_GSTS_readyToPlay`（id 1073741849）的行为，由 TS 在同 ID 接管。
 *
 * 触发：`Signal.playerReady`（准备链路由 StagePanel(1847) 发送；接管 1847 前仍由旧图发送）。
 * 门槛：所有在场玩家 `玩家状态 == 1`（全部已准备）才开局，否则停在准备界面。
 *
 * 与现有「按人数开局」路（turnState.gstsServerInitializeFirstTurnIfNeeded，由 ChessInit 计时器
 * 在满员后触发）目前并存——本函数为忠实接管，刻意不改这条并行路、不写 turnInitialized，
 * 行为与旧图一致（可作「是否破坏现状」的纯回归对照）。两条开局路的统一是后续单独决策项。
 *
 * 编辑器侧前置：游玩布局(playLayout)、开局准备点(openingPresetPoint)、环境配置(openingEnvironment)、
 * 双方物件镜头(player1/2CameraEntityGuid + 条目名)、全局计时器「红方倒计时」、普通计时器「PlayerExit」
 * 与棋子预制体(initPos.红方名称/黑方名称) 均需已在编辑器存在（旧图已使用，故均成立）。
 */
export function gstsServerStartGame() {
  let stage = getServerStageEntity()
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()

  //全员已准备才开局（gstsServer 函数不允许提前 return，故用 if 包裹整段开局逻辑）
  let allReady = true
  for (let i = 0; i < players.length; i++) {
    if (players[i].get('玩家状态').asType('float') != 1) {
      allReady = false
    }
  }

  if (allReady) {
    //开局准备点（双方玩家传送到此）
    let preset = gsts.f.queryPresetPointPositionRotation(openingPresetPoint)

    for (let i = 0; i < players.length; i++) {
      let p = players[i] as entity
      //传送到开局准备点
      gsts.f.teleportPlayer(p, preset.location, preset.rotate)
      //停止「准备阶段定时发对方状态」的计时器
      gsts.f.stopTimer(p, 'sendCurStageToOther')
      //从准备界面切到游玩布局
      gsts.f.switchCurrentInterfaceLayout(p, playLayout)
      //本方剩余棋子归 16
      p.set('剩余棋子', 16)
      //关闭遗留的播报文字
      p.setUiControlStatus(ui_broadcastText, UIControlGroupStatus.Off)

      //红方先手：红方获得操控权、显示红方倒计时、设主视角并记为当前行动方；黑方仅设主视角
      if (gsts.f.queryEntityFaction(p) == factionRed) {
        p.set('isControl', true)
        p.setUiControlStatus(timersId.red, UIControlGroupStatus.On)
        gsts.f.setPlayerCameraToFollowEntity(
          p,
          gsts.f.queryEntityByGuid(player1CameraEntityGuid),
          player1CameraEntry
        )
        stage.set('curPlayer', p)
      } else {
        gsts.f.setPlayerCameraToFollowEntity(
          p,
          gsts.f.queryEntityByGuid(player2CameraEntityGuid),
          player2CameraEntry
        )
      }

      //开局播报全屏动效
      p.playUiAnimationOnControl(ui_broadcastFxFull)
      p.set('step', 0)
    }

    //开局环境（旧图按玩家逐个应用，这里对全体一次应用，等价）
    gsts.f.modifyEnvironmentSettings(openingEnvironment, players, false, 0)

    stage.set('canChange', true)
    gsts.f.startGlobalTimer(stage, GlobalTimer_RedCountdown)

    //清除上一局残留的棋子实体
    let oldPieces = gsts.f.getEntityListByUnitTag(EntityTag.Piece)
    for (let i = 0; i < oldPieces.length; i++) {
      gsts.f.removeEntity(oldPieces[i])
    }

    //按初始坐标生成红/黑双方各 16 枚棋子（位置 = firstChessPos + 坐标 * 格距；红 owner=玩家1/朝向90，黑 owner=玩家2/朝向270）
    let player1 = player(1) as entity
    let player2 = player(2) as entity
    let pieceTag = list('int', [PIECE_TAG_INDEX])
    //循环上界取坐标列表长度（int，与原图 Get_List_Length 一致）：红黑各 16 枚
    for (let i = 0; i < initPos.红方坐标.length; i++) {
      let redPos = gsts.f._3dVectorAddition(
        firstChessPos,
        Vector3.Scale(initPos.红方坐标[i], chessInterval)
      )
      gsts.f.createPrefab(
        initPos.红方名称[i],
        redPos,
        gsts.f.create3dVector(0, 90, 0),
        player1,
        true,
        1,
        pieceTag
      )
      let blackPos = gsts.f._3dVectorAddition(
        firstChessPos,
        Vector3.Scale(initPos.黑方坐标[i], chessInterval)
      )
      gsts.f.createPrefab(
        initPos.黑方名称[i],
        blackPos,
        gsts.f.create3dVector(0, 270, 0),
        player2,
        true,
        1,
        pieceTag
      )
    }

    stage.set('GameStage', 2)
    //开局后周期检测玩家退出（普通计时器，5s/次）
    gsts.f.startTimer(stage, 'PlayerExit', true, [5])
  }
}
