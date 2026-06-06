import type { entity, faction, vec3 } from 'genshin-ts/runtime/value'
import * as Global from '../Global'

const GSTS_TRAJECTORY_EPSILON = 0.001
const GSTS_TRAJECTORY_PARALLEL_EPSILON = 0.0001
const MAX_PREVIEW_DIST = 60

export function gstsServerRayCircleIntersect(
  origin: vec3,
  dir: vec3,
  center: vec3,
  radius: number
): { hit: boolean; t: number; point: vec3 } {
  let hit = false
  let t = 0
  let point = origin

  const dir2D = gsts.f.create3dVector(dir.x, 0, dir.z)
  const d = gsts.f._3dVectorSubtraction(center, origin)
  const d2D = gsts.f.create3dVector(d.x, 0, d.z)

  const tProj = gsts.f._3dVectorDotProduct(d2D, dir2D)
  const dLenSq = gsts.f._3dVectorDotProduct(d2D, d2D)
  const e2 = dLenSq - tProj * tProj
  const r2 = radius * radius

  if (e2 <= r2) {
    const dt = Mathf.Sqrt(r2 - e2)
    const tHit = tProj - dt

    if (tHit > GSTS_TRAJECTORY_EPSILON) {
      const offset = gsts.f._3dVectorZoom(dir, tHit)
      point = gsts.f._3dVectorAddition(origin, offset)
      t = tHit
      hit = true
    }
  }

  return { hit, t, point }
}

export function gstsServerRayPlaneIntersect(
  origin: vec3,
  dir: vec3,
  wallNormal: vec3,
  wallPoint: vec3
): { hit: boolean; t: number; point: vec3 } {
  let hit = false
  let t = 0
  let point = origin

  const denom = gsts.f._3dVectorDotProduct(dir, wallNormal)

  if (Mathf.Abs(denom) >= GSTS_TRAJECTORY_PARALLEL_EPSILON) {
    const wallToOrigin = gsts.f._3dVectorSubtraction(wallPoint, origin)
    const tHit = gsts.f._3dVectorDotProduct(wallToOrigin, wallNormal) / denom

    if (tHit > GSTS_TRAJECTORY_EPSILON) {
      const offset = gsts.f._3dVectorZoom(dir, tHit)
      point = gsts.f._3dVectorAddition(origin, offset)
      t = tHit
      hit = true
    }
  }

  return { hit, t, point }
}

export function gstsServerReflectVec(incident: vec3, normal: vec3): vec3 {
  const dotValue = gsts.f._3dVectorDotProduct(incident, normal)
  const step1 = gsts.f._3dVectorZoom(normal, dotValue)
  const step2 = gsts.f._3dVectorZoom(step1, 2)
  const reflectVec = gsts.f._3dVectorSubtraction(incident, step2)
  return gsts.f._3dVectorNormalization(reflectVec)
}

type GstsTrajectoryResult = {
  hasHit: boolean
  t: number
  point: vec3
  wallNormal: vec3
  hitChess: boolean
}

function gstsServerMakeSentinel(origin: vec3): GstsTrajectoryResult {
  return {
    hasHit: false,
    t: MAX_PREVIEW_DIST + 1,
    point: origin,
    wallNormal: gsts.f.create3dVector(0, 0, 0),
    hitChess: false
  }
}

function gstsServerUpdateIfNearer(
  current: GstsTrajectoryResult,
  tHit: number,
  hitPoint: vec3,
  wallNormal: vec3,
  isChess: boolean
): GstsTrajectoryResult {
  let result = current
  if (tHit > GSTS_TRAJECTORY_EPSILON && tHit <= MAX_PREVIEW_DIST && tHit < current.t) {
    result = { hasHit: true, t: tHit, point: hitPoint, wallNormal, hitChess: isChess }
  }
  return result
}

function gstsServerFindFirstHit(
  origin: vec3,
  dir: vec3,
  chessType: string,
  faction: faction,
  shooterEntity: entity
): GstsTrajectoryResult {
  let best = gstsServerMakeSentinel(origin)

  const allChess = gsts.f.getEntityListByUnitTag(Global.EntityTag.QiZi)
  for (const chess of allChess) {
    if (chess != shooterEntity) {
      const dir2D = gsts.f.create3dVector(dir.x, 0, dir.z)
      const d = gsts.f._3dVectorSubtraction(chess.pos, origin)
      const d2D = gsts.f.create3dVector(d.x, 0, d.z)
      const tProj = gsts.f._3dVectorDotProduct(d2D, dir2D)
      const dLenSq = gsts.f._3dVectorDotProduct(d2D, d2D)
      const e2 = dLenSq - tProj * tProj
      const r2 = Global.radius * Global.radius
      if (e2 <= r2) {
        const dt = Mathf.Sqrt(r2 - e2)
        const tHit = tProj - dt
        const hitPoint = gsts.f._3dVectorAddition(origin, gsts.f._3dVectorZoom(dir, tHit))
        best = gstsServerUpdateIfNearer(best, tHit, hitPoint, gsts.f.create3dVector(0, 0, 0), true)
      }
    }
  }

  best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(0, 0, 1), gsts.f.create3dVector(0, 0, Global.Wall.leftz))
  best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(0, 0, -1), gsts.f.create3dVector(0, 0, Global.Wall.rightz))
  best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(Global.Wall.topx, 0, 0))
  best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(Global.Wall.floorx, 0, 0))

  if (chessType == '士' || chessType == '帅' || chessType == '将') {
    const nineWall = Global.gsteServerGetNineWall(faction)
    const nineWallLeftZ = nineWall[0]
    const nineWallRightZ = nineWall[1]
    const nineWallForwardX = nineWall[2]
    best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(0, 0, 1), gsts.f.create3dVector(0, 0, nineWallLeftZ))
    best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(0, 0, -1), gsts.f.create3dVector(0, 0, nineWallRightZ))
    if (faction == Global.factionRed) {
      best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(nineWallForwardX, 0, 0))
    }
    if (faction == Global.factionBlack) {
      best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(nineWallForwardX, 0, 0))
    }
  }

  if (chessType == '象' || chessType == '相') {
    if (faction == Global.factionRed) {
      best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(Global.Wall.center, 0, 0))
    }
    if (faction == Global.factionBlack) {
      best = gstsServerCheckWall(best, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(Global.Wall.center, 0, 0))
    }
  }

  return best
}

function gstsServerCheckWall(
  current: GstsTrajectoryResult,
  origin: vec3,
  dir: vec3,
  wallNormal: vec3,
  wallPoint: vec3
): GstsTrajectoryResult {
  let result = current
  const denom = gsts.f._3dVectorDotProduct(dir, wallNormal)
  if (Mathf.Abs(denom) >= GSTS_TRAJECTORY_PARALLEL_EPSILON) {
    const wallToOrigin = gsts.f._3dVectorSubtraction(wallPoint, origin)
    const tHit = gsts.f._3dVectorDotProduct(wallToOrigin, wallNormal) / denom
    const hitPoint = gsts.f._3dVectorAddition(origin, gsts.f._3dVectorZoom(dir, tHit))
    result = gstsServerUpdateIfNearer(current, tHit, hitPoint, wallNormal, false)
  }
  return result
}

export function gstsServerCalcTrajectoryPreview(
  origin: vec3,
  dir: vec3,
  chessType: string,
  faction: faction,
  shooterEntity: entity
): { seg1End: vec3; seg2End: vec3 | null; hitChess: boolean } {
  const normalizedDir = gsts.f._3dVectorNormalization(dir)
  const firstHit = gstsServerFindFirstHit(origin, normalizedDir, chessType, faction, shooterEntity)

  let seg1End = gstsServerGetPreviewMaxPoint(origin, normalizedDir)
  let seg2End: vec3 | null = null
  let hitChess = false

  if (firstHit.hasHit) {
    seg1End = firstHit.point
    if (firstHit.hitChess) {
      hitChess = true
    } else {
      const reflectDir = gstsServerReflectVec(normalizedDir, firstHit.wallNormal)
      const secondHit = gstsServerFindFirstHit(firstHit.point, reflectDir, chessType, faction, shooterEntity)
      if (secondHit.hasHit) {
        seg2End = secondHit.point
      } else {
        seg2End = gstsServerGetPreviewMaxPoint(firstHit.point, reflectDir)
      }
    }
  }

  return { seg1End, seg2End, hitChess }
}

function gstsServerGetPreviewMaxPoint(origin: vec3, dir: vec3): vec3 {
  const offset = gsts.f._3dVectorZoom(dir, MAX_PREVIEW_DIST)
  return gsts.f._3dVectorAddition(origin, offset)
}
