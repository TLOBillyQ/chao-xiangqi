import { g } from 'genshin-ts/runtime/core'

import { EntityTag, factionBlack, factionRed } from '../../Global'

//从 .gil 反编译恢复的扫描图（原图 _GSTS_newGetChessNode，id=1073741851，127 节点，源码曾遗失）
//挂在「跟随玩家实体」的扫描实体上（跟随运动器为编辑器侧配置）：
//每 0.03s 在玩家正下方 5.66 处、半径 1 范围内找己方最近的棋子，
//给它挂选中光效（10010010，缩放1.4）并写入玩家的 ScanEntity；失焦时清光效、ScanEntity 置回扫描实体自身作空哨兵

g.server({
  id: 1073741851,
  name: 'newGetChessNode'
}).on('whenEntityIsCreated', (_evt, f) => {
  f.startTimer(self, 'newgetChess', true, [0.03])
})

g.server({
  id: 1073741851
}).on('whenTimerIsTriggered', (_evt, f) => {
  let player = f.getFollowMotionDeviceTarget(self).followTargetEntity
  let playerFaction = f.queryEntityFaction(player)
  let factionPieces = f.getEntityListBySpecifiedFaction(
    f.getEntityListByUnitTag(EntityTag.Piece),
    playerFaction
  )
  //扫描点：玩家正下方 5.66（棋盘面高度）
  let playerPos = f.getEntityLocationAndRotation(player).location
  let scanPos = f.create3dVector(playerPos.x, playerPos.y - 5.66, playerPos.z)
  let candidates = f.getEntityListBySpecifiedRange(factionPieces, scanPos, 1)
  let isControl = player.get('isControl').asType('bool')

  if (candidates.length > 0 && isControl) {
    //取距扫描点最近的棋子（minDist==0 作未赋值哨兵，首轮必然赋值）
    let minDist = 0
    let best = candidates[0]
    for (let i = 0; i < candidates.length; i++) {
      let curDist = f.distanceBetweenTwoCoordinatePoints(
        f.getEntityLocationAndRotation(candidates[i]).location,
        scanPos
      )
      if (minDist == 0 || curDist < minDist) {
        minDist = curDist
        best = candidates[i]
      }
    }

    let oldScan = player.get('ScanEntity').asType('entity')
    let pieceType = best.get('棋子类型').asType('str')

    let canSelect = 0
    if (pieceType == '士' || pieceType == '帅') {
      //士/帅只在九宫内可选：z∈[6.2,15.4]，红方 x>=-9.28、黑方 x<=-22.73
      let bestPos = f.getEntityLocationAndRotation(best).location
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
      if (player.get('step').asType('float') <= 3) {
        canSelect = 0
      }
    }

    if (oldScan != best && canSelect == 1) {
      f.clearSpecialEffectsBasedOnSpecialEffectAssets(oldScan, configId(10010010))
      player.set('ScanEntity', best)
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
    let oldScan = player.get('ScanEntity').asType('entity')
    f.clearSpecialEffectsBasedOnSpecialEffectAssets(oldScan, configId(10010010))
    player.set('ScanEntity', self)
  }
})
