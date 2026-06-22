import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import {
  camP1Anchor,
  camP2Anchor,
  EntityTag,
  env_playAmbience,
  factionRed,
  layout_play,
  presetPoint_ready,
  ui_broadcastFxFull,
  ui_broadcastText
} from '../../contracts/editorIds'
import { chessInterval, firstChessPos, initPos } from '../../contracts/stage'
import { Tick_SendCurStageToOther } from '../../contracts/timers'
import { PlayerVar } from '../../contracts/variables'

/**
 * readyToPlay(1073741849) 同 ID 接管。挂【关卡实体】。ADR-0003 后本文件降为【摆盘 helper 集】：
 * 开局编排（可开局闸 + 置 PLAYING + 授首回合 + 起倒计时）已上移 systems/stage/matchLifecycle，
 * 本文件只导出供其调用的三个摆盘步骤——gstsServerSetupReadyPlayers / gstsServerClearBoard / gstsServerPlacePieces。
 * 真值见 recovered/orphan-nodegraphs/1073741849_readyToPlay.readable.txt；清场用倒序索引（避开 0bde1c2 的死循环）；
 * 镜头锚/预设点/棋子预制 GUID 已对活地图 1073741868 字节核验存在。
 */

/** 逐玩家开局态：传送预设点、停状态同步计时器、切游玩布局、环境、剩余棋子=16、隐播报、按阵营设物件镜头、播报动效、step 归零。 */
export function gstsServerSetupReadyPlayers() {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let preset = gsts.f.queryPresetPointPositionRotation(presetPoint_ready)
  for (let i = 0; i < players.length; i++) {
    //genshin PlayerEntity 缺 switch/camera/playUiAnim 等方法，转 typeof self 拿全实体方法（同 chessDestroy）
    let p = players[i] as typeof self
    gsts.f.teleportPlayer(p, preset.location, preset.rotate)
    gsts.f.stopTimer(p, Tick_SendCurStageToOther)
    p.switchCurrentInterfaceLayout(layout_play)
    gsts.f.modifyEnvironmentSettings(env_playAmbience, [p], false, 0)
    p.set(PlayerVar.remainPieces, 16n)
    p.setUiControlStatus(ui_broadcastText, UIControlGroupStatus.Off)
    //红=玩家1镜头(1077937005)，黑=玩家2镜头(1077937007)；物件镜头只能用 followEntity+条目名
    if (gsts.f.queryEntityFaction(p) == factionRed) {
      p.setPlayerCameraToFollowEntity(gsts.f.queryEntityByGuid(camP1Anchor), '玩家1镜头')
    } else {
      p.setPlayerCameraToFollowEntity(gsts.f.queryEntityByGuid(camP2Anchor), '玩家2镜头')
    }
    p.playUiAnimationOnControl(ui_broadcastFxFull)
    p.set(PlayerVar.step, 0)
  }
}

/** 清场：再来一局残留棋子按标签取活引用，删当前末位直到清空（每删 length-1；999 显式计数兜底）。 */
export function gstsServerClearBoard() {
  //等价原图 Node65-73 的 Finite_Loop(999)+break（取活引用、删末位、重判长度）；
  //用带计数上限的 while 表达，避开 gsts 不支持的 i-- 递减循环，也避开 0bde1c2 的裸 while removeEntity 死循环。
  let pieces = gsts.f.getEntityListByUnitTag(EntityTag.Piece)
  let guard = 0
  while (pieces.length > 0 && guard < 999) {
    gsts.f.removeEntity(pieces[pieces.length - 1])
    guard = guard + 1
  }
}

/** 摆 16+16：红子归玩家1、黑子归玩家2；世界坐标 = firstChessPos + 格点×chessInterval；红朝向 y=90、黑 y=270；挂棋子标签。 */
export function gstsServerPlacePieces() {
  let redOwner = gsts.f.queryEntityByGuid(gsts.f.getPlayerGuidByPlayerId(1))
  let blackOwner = gsts.f.queryEntityByGuid(gsts.f.getPlayerGuidByPlayerId(2))
  let redPos = initPos.红方坐标
  let redName = initPos.红方名称
  let blackPos = initPos.黑方坐标
  let blackName = initPos.黑方名称
  for (let i = 0; i < redPos.length; i++) {
    let redWorld = gsts.f._3dVectorAddition(
      firstChessPos,
      gsts.f._3dVectorZoom(redPos[i], chessInterval)
    )
    gsts.f.createPrefab(redName[i], redWorld, vec3([0, 90, 0]), redOwner, true, 1, [
      EntityTag.Piece
    ])
    let blackWorld = gsts.f._3dVectorAddition(
      firstChessPos,
      gsts.f._3dVectorZoom(blackPos[i], chessInterval)
    )
    gsts.f.createPrefab(blackName[i], blackWorld, vec3([0, 270, 0]), blackOwner, true, 1, [
      EntityTag.Piece
    ])
  }
}
