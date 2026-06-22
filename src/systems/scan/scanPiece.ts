import { EntityTag, factionBlack, factionRed } from '../../contracts/editorIds'
import { PieceVar, PlayerVar } from '../../contracts/variables'

/**
 * 扫描玩家正下方可选棋子，并维护玩家 ScanEntity 与选中光效。
 */
export function gstsServerScanPieceTick() {
  let player = gsts.f.getFollowMotionDeviceTarget(self).followTargetEntity
  let playerFaction = gsts.f.queryEntityFaction(player)
  let factionPieces = gsts.f.getEntityListBySpecifiedFaction(
    gsts.f.getEntityListByUnitTag(EntityTag.Piece),
    playerFaction
  )
  //扫描点：玩家正下方 5.66（棋盘面高度）
  let playerPos = gsts.f.getEntityLocationAndRotation(player).location
  let scanPos = gsts.f.create3dVector(playerPos.x, playerPos.y - 5.66, playerPos.z)
  let candidates = gsts.f.getEntityListBySpecifiedRange(factionPieces, scanPos, 1)
  let isControl = player.get(PlayerVar.isControl).asType('bool')

  if (candidates.length > 0 && isControl) {
    //取距扫描点最近的棋子（minDist==0 作未赋值哨兵，首轮必然赋值）
    let minDist = 0
    let best = candidates[0]
    for (let i = 0; i < candidates.length; i++) {
      let curDist = gsts.f.distanceBetweenTwoCoordinatePoints(
        gsts.f.getEntityLocationAndRotation(candidates[i]).location,
        scanPos
      )
      if (minDist == 0 || curDist < minDist) {
        minDist = curDist
        best = candidates[i]
      }
    }

    let oldScan = player.get(PieceVar.scanEntity).asType('entity')
    let pieceType = best.get(PieceVar.pieceType).asType('str')

    let canSelect = 0
    if (pieceType == '士' || pieceType == '帅') {
      //士/帅只在九宫内可选：z∈[6.2,15.4]，红方 x>=-9.28、黑方 x<=-22.73
      let bestPos = gsts.f.getEntityLocationAndRotation(best).location
      if (bestPos.z >= 6.2 && bestPos.z <= 15.4) {
        if (playerFaction == factionRed && bestPos.x >= -9.28) {
          canSelect = 1
        } else if (playerFaction == factionBlack && bestPos.x <= -22.73) {
          canSelect = 1
        }
      }
    } else {
      canSelect = 1
    }
    //帅在前 3 步内不可选（step 为玩家走棋计数，见 StopCharge）
    if (pieceType == '帅') {
      if (player.get(PlayerVar.step).asType('float') <= 3) {
        canSelect = 0
      }
    }

    if (oldScan != best && canSelect == 1) {
      gsts.f.clearSpecialEffectsBasedOnSpecialEffectAssets(oldScan, configId(10010010))
      player.set(PieceVar.scanEntity, best)
      best.mountLoopingSpecialEffect(
        configId(10010010),
        'GI_RootNode',
        true,
        true,
        [0, 0, 0],
        [0, 0, 0],
        1.4,
        true
      )
    }
  } else {
    let oldScan = player.get(PieceVar.scanEntity).asType('entity')
    gsts.f.clearSpecialEffectsBasedOnSpecialEffectAssets(oldScan, configId(10010010))
    player.set(PieceVar.scanEntity, self)
  }
}
