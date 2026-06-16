import type { entity, vec3 } from 'genshin-ts/runtime/value'

import {
  dirPrefabs,
  EntityTag,
  factionBlack,
  factionRed,
  landingPrefab
} from '../../contracts/editorIds'
import { deltaMoveTriggerBefore, landingCalibration, radius } from '../../contracts/physics'
import { Wall } from '../../contracts/stage'
import { gstsServerVec3ToVec2 } from '../../core/vector'

/**
 * 有效初速：镜像 gstsServerConfirmAndMovePiece 里兵过河初速=25 的覆盖逻辑
 */
export function gstsServerEffectiveInitSpeed(piece: entity) {
  let initSpeed = piece.get('initSpeed').asType('float')
  let pieceType = piece.get('棋子类型').asType('str')
  let Faction = piece.faction()
  let pos = piece.pos

  if (Faction == factionRed) {
    if (pos.x < Wall.center && pieceType == '兵') {
      initSpeed = 25
    }
  }
  if (Faction == factionBlack) {
    if (pos.x > Wall.center && pieceType == '兵') {
      initSpeed = 25
    }
  }
  return initSpeed
}

/**
 * 按真实减速模型预计算自由滑行距离
 * 碰撞前每tick速度乘(1-deltaT*deltaMoveTriggerBefore)，模长<=0.1停止
 * 实测拟合（2026-06-10 日志，干净样本 v0∈[5.76,14.8]）：实际距离 = v0-0.1，残差<0.006
 * 即每个阻尼周期实际位移约 v*2*deltaT（定时器实际生效间隔约为设定值两倍），
 * 等比级数闭式解 d = 2*(v0-v_stop)/deltaMoveTriggerBefore，v_stop≈0.1
 * landingCalibration 为后续微调系数
 */
export function gstsServerPredictMoveDistance(v0: number) {
  let d = (((v0 - 0.1) * 2) / deltaMoveTriggerBefore) * landingCalibration
  if (d < 0) {
    d = 0
  }
  return d
}

/**
 * 沿单位方向 worldDir 在 XZ 平面做射线-圆相交，求滑行路径上首个棋子的接触距离
 * 接触发生在圆心距 2*radius 处（与 gstsServerRealDir 的 Sqrt(4-...) 同一模型）
 * 只预测第一次碰撞，不模拟碰后动量传递；无碰撞则返回 maxDist
 */
export function gstsServerFirstHitDistance(piece: entity, worldDir: vec3, maxDist: number) {
  let best = maxDist
  let piecePos = piece.pos
  let contactSq = 2 * radius * (2 * radius)
  let pieceList = gsts.f.getEntityListByUnitTag(EntityTag.Piece)
  for (let i = 0; i < pieceList.length; i++) {
    if (pieceList[i] != piece) {
      let targetPos = pieceList[i].pos
      let dx = targetPos.x - piecePos.x
      let dz = targetPos.z - piecePos.z
      let t = dx * worldDir.x + dz * worldDir.z
      if (t > 0) {
        let perpSq = dx * dx + dz * dz - t * t
        if (perpSq < contactSq) {
          let tHit = t - Mathf.Sqrt(contactSq - perpSq)
          if (tHit < 0) {
            tHit = 0
          }
          if (tHit < best) {
            best = tHit
          }
        }
      }
    }
  }
  return best
}

/**
 * 销毁场上所有落点指示
 */
export function gstsServerDestroyLandingMarker() {
  let markerList = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(landingPrefab)
  while (markerList.length > 0) {
    gsts.f.destroyEntity(markerList[markerList.length - 1])
  }
}

/**
 * 在预计算出的落点位置生成落点指示（不挂运动器，位置完全由预计算距离决定）
 */
export function gstsServerSpawnLandingMarker(spawnPos: vec3, ownerPiece: entity) {
  let marker = gsts.f.createPrefab(
    landingPrefab,
    spawnPos,
    gsts.f.create3dVector(0, 0, 0),
    ownerPiece,
    true,
    1,
    list('int', [])
  )
  //纯视觉指示：关掉碰撞，避免触发棋子命中检测
  marker.activateDisableNativeCollision(false)
}

/**
 * 预计落点对账：每个蓄力tick按真实减速模型预计算运动距离并放置落点
 * 路径上有棋子则截断到首次接触点（见 gstsServerFirstHitDistance）
 * 缺失则生成；与预计算位置偏差>0.5（含功率增长/归零回弹/中途切方向）则就地重建；预计点越界则钳在墙边
 */
export function gstsServerReconcileLandingMarker(curPlayer: entity) {
  let piece = curPlayer.get('curChooseChess').asType('entity')
  let curDirIndex = curPlayer.get('curDirIndex').asType('float')

  //查找当前选中方向实体的方向向量（同 StopCharge 的匹配方式）
  let found = false
  let moveVec = gsts.f.create3dVector(0, 1, 0)
  let dirListRed = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red)
  for (let i = 0; i < dirListRed.length; i++) {
    if (curDirIndex == dirListRed[i].get('dirUIIndex').asType('float')) {
      moveVec = dirListRed[i].get('moveVec').asType('vec3')
      found = true
    }
  }
  let dirListBlack = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black)
  for (let i = 0; i < dirListBlack.length; i++) {
    if (curDirIndex == dirListBlack[i].get('dirUIIndex').asType('float')) {
      moveVec = dirListBlack[i].get('moveVec').asType('vec3')
      found = true
    }
  }

  if (found) {
    let worldDir = gstsServerVec3ToVec2(moveVec)
    let initSpeed = gstsServerEffectiveInitSpeed(piece)
    let chargePower = gsts.f.getCustomVariable(curPlayer, 'chargePower').asType('float')

    let v0 = (initSpeed * chargePower) / 100
    let d = gstsServerPredictMoveDistance(v0)
    //路径上有棋子则截断到首次接触点
    d = gstsServerFirstHitDistance(piece, worldDir, d)

    let piecePos = piece.pos
    let ex = piecePos.x + worldDir.x * d
    let ez = piecePos.z + worldDir.z * d
    if (ex < Wall.topx) {
      ex = Wall.topx
    }
    if (ex > Wall.bottomX) {
      ex = Wall.bottomX
    }
    if (ez < Wall.leftz) {
      ez = Wall.leftz
    }
    if (ez > Wall.rightz) {
      ez = Wall.rightz
    }
    let expectPos = gsts.f.create3dVector(ex, piecePos.y + 0.1, ez)

    let markerList = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(landingPrefab)
    if (markerList.length == 0) {
      gstsServerSpawnLandingMarker(expectPos, piece)
    } else {
      let deviation = Vector3.Magnitude(Vector3.Sub(markerList[0].pos, expectPos))
      if (deviation > 0.5) {
        gstsServerDestroyLandingMarker()
        gstsServerSpawnLandingMarker(expectPos, piece)
      }
    }
  }
}
