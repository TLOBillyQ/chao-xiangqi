import type { vec3 } from 'genshin-ts/runtime/value'

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
