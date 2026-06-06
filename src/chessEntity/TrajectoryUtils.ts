import type { entity, faction, vec3 } from 'genshin-ts/runtime/value'
import * as Global from '../Global'

const GSTS_TRAJECTORY_EPSILON = 0.001
const GSTS_TRAJECTORY_PARALLEL_EPSILON = 0.0001

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

  return { hit: (hit as any).value, t: (t as any).value, point: (point as any).value }
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

const MAX_PREVIEW_DIST = 60

type GstsTrajectoryWallHit = {
  t: number
  point: vec3
  wallNormal: vec3
  hitChess: 0
}

type GstsTrajectoryChessHit = {
  t: number
  point: vec3
  hitChess: 1
}

type GstsTrajectoryHit = GstsTrajectoryWallHit | GstsTrajectoryChessHit

function gstsServerGetPreviewMaxPoint(origin: vec3, dir: vec3): vec3 {
  const offset = gsts.f._3dVectorZoom(dir, MAX_PREVIEW_DIST)
  return gsts.f._3dVectorAddition(origin, offset)
}

function gstsServerGetNearerPreviewHit(nearestHit: GstsTrajectoryHit, hit: GstsTrajectoryHit): GstsTrajectoryHit {
  let result = nearestHit

  if (hit.t <= MAX_PREVIEW_DIST && hit.t < nearestHit.t) {
    result = hit
  }

  return result
}

function gstsServerFindNearestChessPreviewHit(origin: vec3, dir: vec3, shooterEntity: entity): GstsTrajectoryHit {
  let nearestHit: GstsTrajectoryHit = {
    t: MAX_PREVIEW_DIST + 1,
    point: origin,
    wallNormal: gsts.f.create3dVector(0, 0, 0),
    hitChess: 0 as 0
  }
  const allChess = gsts.f.getEntityListByUnitTag(Global.EntityTag.QiZi)

  for (const chess of allChess) {
    if (chess != shooterEntity) {
      const result = gstsServerRayCircleIntersect(origin, dir, chess.pos, Global.radius)
      if (result.hit) {
        nearestHit = gstsServerGetNearerPreviewHit(nearestHit, { t: result.t, point: result.point, hitChess: 1 as 1 })
      }
    }
  }

  return nearestHit
}

function gstsServerGetNearerPreviewWallHit(
  nearestHit: GstsTrajectoryHit,
  origin: vec3,
  dir: vec3,
  wallNormal: vec3,
  wallPoint: vec3
): GstsTrajectoryHit {
  const result = gstsServerRayPlaneIntersect(origin, dir, wallNormal, wallPoint)
  let nextHit = nearestHit

  if (result.hit) {
    nextHit = gstsServerGetNearerPreviewHit(nearestHit, { t: result.t, point: result.point, wallNormal, hitChess: 0 as 0 })
  }

  return nextHit
}

function gstsServerFindNearestWallPreviewHit(origin: vec3, dir: vec3, chessType: string, faction: faction): GstsTrajectoryHit {
  let nearestHit: GstsTrajectoryHit = {
    t: MAX_PREVIEW_DIST + 1,
    point: origin,
    wallNormal: gsts.f.create3dVector(0, 0, 0),
    hitChess: 0 as 0
  }

  nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(0, 0, 1), gsts.f.create3dVector(0, 0, Global.Wall.leftz))
  nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(0, 0, -1), gsts.f.create3dVector(0, 0, Global.Wall.rightz))
  nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(Global.Wall.topx, 0, 0))
  nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(Global.Wall.floorx, 0, 0))

  if (chessType == '士' || chessType == '帅' || chessType == '将') {
    const nineWall = Global.gsteServerGetNineWall(faction)
    const nineWallLeftZ = nineWall[0]
    const nineWallRightZ = nineWall[1]
    const nineWallForwardX = nineWall[2]

    nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(0, 0, 1), gsts.f.create3dVector(0, 0, nineWallLeftZ))
    nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(0, 0, -1), gsts.f.create3dVector(0, 0, nineWallRightZ))

    if (faction == Global.factionRed) {
      nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(nineWallForwardX, 0, 0))
    }

    if (faction == Global.factionBlack) {
      nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(nineWallForwardX, 0, 0))
    }
  }

  if (chessType == '象' || chessType == '相') {
    if (faction == Global.factionRed) {
      nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(-1, 0, 0), gsts.f.create3dVector(Global.Wall.center, 0, 0))
    }

    if (faction == Global.factionBlack) {
      nearestHit = gstsServerGetNearerPreviewWallHit(nearestHit, origin, dir, gsts.f.create3dVector(1, 0, 0), gsts.f.create3dVector(Global.Wall.center, 0, 0))
    }
  }

  return nearestHit
}

function gstsServerFindNearestPreviewHit(origin: vec3, dir: vec3, chessType: string, faction: faction, shooterEntity: entity): GstsTrajectoryHit {
  let nearestHit = gstsServerFindNearestChessPreviewHit(origin, dir, shooterEntity)
  const wallHit = gstsServerFindNearestWallPreviewHit(origin, dir, chessType, faction)

  nearestHit = gstsServerGetNearerPreviewHit(nearestHit, wallHit)

  return nearestHit
}

export function gstsServerCalcTrajectoryPreview(
  origin: vec3,
  dir: vec3,
  chessType: string,
  faction: faction,
  shooterEntity: entity
): { seg1End: vec3; seg2End: vec3 | null; hitChess: boolean } {
  const normalizedDir = gsts.f._3dVectorNormalization(dir)
  const firstHit = gstsServerFindNearestPreviewHit(origin, normalizedDir, chessType, faction, shooterEntity)
  let seg1End = gstsServerGetPreviewMaxPoint(origin, normalizedDir)
  let seg2End: vec3 | null = null
  let hitChess = false

  if (firstHit != null) {
    seg1End = firstHit.point

    if (firstHit.hitChess === 1) {
      hitChess = true
    } else {
      const reflectDir = gstsServerReflectVec(normalizedDir, firstHit.wallNormal)
      const secondHit = gstsServerFindNearestPreviewHit(firstHit.point, reflectDir, chessType, faction, shooterEntity)

      if (secondHit == null) {
        seg2End = gstsServerGetPreviewMaxPoint(firstHit.point, reflectDir)
      } else {
        seg2End = secondHit.point
      }
    }
  }

  return { seg1End, seg2End, hitChess }
}
