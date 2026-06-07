import type { entity, faction, vec3 } from 'genshin-ts/runtime/value'
import * as Global from '../Global'

const GSTS_TRAJECTORY_EPSILON = 0.001
const GSTS_TRAJECTORY_PARALLEL_EPSILON = 0.0001
const MAX_PREVIEW_DIST = 60

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

function gstsServerSpawnSegment(start: vec3, end: vec3): void {
  const midX = (start.x + end.x) * 0.5
  const midY = (start.y + end.y) * 0.5
  const midZ = (start.z + end.z) * 0.5
  const midPoint = gsts.f.create3dVector(midX, midY, midZ)
  gsts.f.createPrefab(
    Global.trajectoryPrefabId,
    midPoint,
    [0, 0, 0],
    Global.getServerStageEntity(),
    true,
    1,
    [Global.EntityTag.Trajectory]
  )
}

export function gstsServerSpawnTrajectoryForDir(
  origin: vec3,
  normalizedDir: vec3,
  chessType: string,
  faction: faction,
  shooterEntity: entity
): void {
  const firstHit = gstsServerFindFirstHit(origin, normalizedDir, chessType, faction, shooterEntity)

  if (firstHit.hasHit) {
    gstsServerSpawnSegment(origin, firstHit.point)
    if (!firstHit.hitChess) {
      const reflectDir = gstsServerReflectVec(normalizedDir, firstHit.wallNormal)
      const secondHit = gstsServerFindFirstHit(firstHit.point, reflectDir, chessType, faction, shooterEntity)
      if (secondHit.hasHit) {
        gstsServerSpawnSegment(firstHit.point, secondHit.point)
      } else {
        const seg2End = gsts.f._3dVectorAddition(firstHit.point, gsts.f._3dVectorZoom(reflectDir, MAX_PREVIEW_DIST))
        gstsServerSpawnSegment(firstHit.point, seg2End)
      }
    }
  } else {
    const seg1End = gsts.f._3dVectorAddition(origin, gsts.f._3dVectorZoom(normalizedDir, MAX_PREVIEW_DIST))
    gstsServerSpawnSegment(origin, seg1End)
  }
}
