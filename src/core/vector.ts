import type { vec3 } from 'genshin-ts/runtime/value'

//三维转二维
export function gstsServerVec3ToVec2(vector3: vec3) {
  let relVec = gsts.f.create3dVector(vector3.y * -1, 0, vector3.x)
  return relVec
}

/**
 * //计算反射角
 * @param enterVec 入射角
 * @param vecFa 墙面向外法线向量
 * @returns
 */
export function gstsServerCalculateReflectVector(enterVec: vec3, vecFa: vec3): vec3 {
  //let R = enterVec- 2 (enterVec.vecFa) vecFa
  const step1 = gsts.f._3dVectorDotProduct(enterVec, vecFa)
  const step2 = gsts.f._3dVectorZoom(vecFa, step1)
  const step3 = gsts.f._3dVectorZoom(step2, 2)
  const reflectVec = gsts.f._3dVectorSubtraction(enterVec, step3)

  return reflectVec
}
