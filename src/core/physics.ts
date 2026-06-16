import type { entity } from 'genshin-ts/runtime/value'

import { e, radius } from '../contracts/physics'
import { getServerStageEntity } from '../contracts/stage'
import { Tick_MoveActive, Tick_OutCheck } from '../contracts/timers'

export function gstsServerCalculateImpulse(entity_1: entity, entity_2: entity) {
  let enterPos = gsts.f.getEntityLocationAndRotation(entity_1).location
  let selfPos = gsts.f.getEntityLocationAndRotation(entity_2).location

  //质量
  let mass_1 = gsts.f.getCustomVariable(entity_1, 'Mass').asType('float')
  let mass_2 = gsts.f.getCustomVariable(entity_2, 'Mass').asType('float')

  //线速度
  let vec1 = gsts.f.getCustomVariable(entity_1, 'moveVec').asType('vec3')
  let vec2 = gsts.f.getCustomVariable(entity_2, 'moveVec').asType('vec3')

  let enterTriCount = entity_1.get('triggerCount').asType('float')
  let selfTriCount = entity_2.get('triggerCount').asType('float')

  //只有第一次进行精密碰撞检测
  if (enterTriCount == 1 && selfTriCount == 1) {
    if (Vector3.Magnitude(vec1) != 0) {
      enterPos = gstsServerRealDir(entity_1, entity_2)
    }

    if (Vector3.Magnitude(vec2) != 0) {
      selfPos = gstsServerRealDir(entity_1, entity_2)
    }
  }

  // 核心计算步骤 (极简版2D刚体碰撞冲量算法)
  // 步骤一：求碰撞法线 (Normal) 和切线 (Tangent)
  // 设碰撞发生时，从棋子1圆心指向棋子2圆心的单位向量为法线 n。
  // 切线向量 t 就是法线顺时针旋转90度：
  let vecN = gsts.f._3dVectorSubtraction(selfPos, enterPos)

  vecN = gsts.f._3dVectorNormalization(vecN)
  //获取出发坐标
  let startPos = getServerStageEntity()
    .get('curPlayer')
    .asType('entity')
    .get('startPos')
    .asType('vec3')

  // $\vec{v}_{rel} = \vec{v}_2 - \vec{v}_1$
  // 步骤二：求相对速度
  // 接触点上的相对速度 vrel 等于两球的线速度差，加上自转带来的线速度差。
  // $I = \frac{1}{2} m r^2$
  // (此处简化了角速度对碰撞点线速度的影响，以满足休闲游戏性能)

  let vecRel = gsts.f._3dVectorSubtraction(vec2, vec1)

  let CrossVec = Vector3.Cross(vecRel, Vector3.Sub(enterPos, startPos))
  if (Vector3.Magnitude(CrossVec) == 0) {
    CrossVec = Vector3.Cross(Vector3.Scale(vecRel, -1), Vector3.Sub(selfPos, startPos))
  }

  let vecT = gsts.f._3dVectorRotation([0, 90, 0], vecN) //切线向量
  if (CrossVec.y > 0) {
    let relRotate = -90
    vecT = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, relRotate, 0), vecN) //切线向量
  }

  //转动惯量
  let I1 = 0.5 * mass_1 * radius * radius
  let I2 = 0.5 * mass_2 * radius * radius

  // 步骤三：计算法向冲量（反弹力 jnjn）
  //法向冲量
  let jn = ((1 + e) * gsts.f._3dVectorDotProduct(vecRel, vecN) * -1) / (1 / mass_1 + 1 / mass_2)
  // 步骤四：计算切向冲量（产生旋转的摩擦力 jt）
  // 切向速度投影：
  // $v_t = \vec{v}_{rel} \cdot \vec{t}$
  let vt = gsts.f._3dVectorDotProduct(vecRel, vecT)
  // 切向冲量：
  // $j_n = \frac{-(1 + e) (\vec{v}_{rel} \cdot \vec{n})}{\frac{1}{m_1} + \frac{1}{m_2}}$
  let jt = ((vt * 1) / (1 / mass_1 + 1 / mass_2)) * -1

  // 	(注意：要用摩擦力限制它，所以 jt 的最大值不能超过 μ×jn)
  let Ff = 0.2 * jn

  if (jt >= Ff) jt = Ff

  //计算主动碰撞棋子的速度和旋转
  //线速度
  let an1 = gsts.f._3dVectorZoom(vecN, jn / mass_1)
  let at1 = gsts.f._3dVectorZoom(vecT, jt / mass_1)

  let v1 = gsts.f._3dVectorSubtraction(gsts.f._3dVectorSubtraction(vec1, an1), at1)

  gsts.f.setCustomVariable(entity_1, 'moveVec', v1)
  const omg1 = ((jt * radius) / I1) * 30 * -1

  gsts.f.stopAndDeleteBasicMotionDevice(entity_1, '', true)
  gsts.f.addUniformBasicLinearMotionDevice(entity_1, 'forwardMove', 99, v1)

  let crossOmg1 = Vector3.Cross(v1, vecT)

  if (crossOmg1.y > 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_1, 'rotate', 99, omg1, [0, -1, 0])
  } else if (crossOmg1.y < 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_1, 'rotate', 99, omg1, [0, 1, 0])
  }

  gsts.f.startTimer(entity_1, Tick_MoveActive, true, [0.03])
  gsts.f.startTimer(entity_1, Tick_OutCheck, true, [0.03])

  let an2 = gsts.f._3dVectorZoom(vecN, jn / mass_2)
  let at2 = gsts.f._3dVectorZoom(vecT, jt / mass_2)
  let v2 = gsts.f._3dVectorAddition(vec2, gsts.f._3dVectorAddition(an2, at2))

  gsts.f.setCustomVariable(entity_2, 'moveVec', v2)

  gsts.f.stopAndDeleteBasicMotionDevice(entity_2, '', true)
  gsts.f.addUniformBasicLinearMotionDevice(entity_2, 'forwardMove', 99, v2)

  const omg2 = ((jt * radius) / I2) * 30
  let crossOmg2 = Vector3.Cross(v2, vecT)

  if (crossOmg2.y > 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_2, 'rotate', 99, omg2, [0, -1, 0])
  } else if (crossOmg2.y < 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_2, 'rotate', 99, omg2, [0, 1, 0])
  }

  gsts.f.startTimer(entity_2, Tick_MoveActive, true, [0.03])
  gsts.f.startTimer(entity_2, Tick_OutCheck, true, [0.03])
}

/**
 * 获取真实碰撞点坐标
 * @param firstChess
 * @param secondChess
 * @returns
 */
export function gstsServerRealDir(firstChess: entity, secondChess: entity) {
  let startPos = getServerStageEntity()
    .get('curPlayer')
    .asType('entity')
    .get('startPos')
    .asType('vec3')
  let isStart = firstChess.get('isStart').asType('bool')
  let startChess = firstChess
  let entChess = secondChess
  if (!isStart) {
    startChess = secondChess
    entChess = firstChess
  }

  let movevec = startChess.get('moveVec').asType('vec3')
  let step1rad = Vector3.Angle(movevec, Vector3.Sub(entChess.pos, startPos))
  let _Angle = gsts.f.radiansToDegrees(step1rad)
  //方向法向量模长
  let fvecMagnitude =
    Vector3.Magnitude(Vector3.Sub(entChess.pos, startPos)) * gsts.f.sineFunction(step1rad)

  //方向法向量的和速度向量的交点到碰撞点的距离
  let outMagnitude = Mathf.Sqrt(4 - fvecMagnitude * fvecMagnitude)
  //方向法向量的和速度向量的交点到起始点的距离
  let ALLMagnitude = Mathf.Sqrt(
    Vector3.Magnitude(Vector3.Sub(entChess.pos, startPos)) *
      Vector3.Magnitude(Vector3.Sub(entChess.pos, startPos)) -
      fvecMagnitude * fvecMagnitude
  )

  let finMovedis = ALLMagnitude - outMagnitude
  let triggerPos = Vector3.Add(
    startPos,
    Vector3.Scale(gsts.f._3dVectorNormalization(Vector3.Sub(entChess.pos, startPos)), finMovedis)
  )

  return triggerPos
}
