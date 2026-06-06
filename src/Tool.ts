//import {vec3 } from 'genshin-ts/runtime/value'

import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import type { bool, entity, faction, float, vec3 } from 'genshin-ts/runtime/value'

import * as Global from './Global'
import * as UIControl from './UIControlGroupId'

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

export function gstsCalselfreflect‌Vec(enterVec: vec3, vecFa: vec3): vec3 {
  //let R = enterVec- 2 (enterVec.vecFa) vecFa
  let step1 = gsts.f._3dVectorDotProduct(enterVec, vecFa)
  let step2 = gsts.f._3dVectorZoom(vecFa, step1)
  let step3 = gsts.f._3dVectorZoom(step2, 2)
  let reflect‌Vec = gsts.f._3dVectorSubtraction(enterVec, step3)

  return reflect‌Vec
}

export function gstsServerCaliImpulse(entity_1: entity, entity_2: entity) {
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
  //let vecN = gsts.f._3dVectorSubtraction(selfPos,enterPos) //法线向量
  let vecN = gsts.f._3dVectorSubtraction(selfPos, enterPos)

  vecN = gsts.f._3dVectorNormalization(vecN)
  //获取出发坐标
  let startPos = Global.getServerStageEntity()
    .get('curPlayer')
    .asType('entity')
    .get('startPos')
    .asType('vec3')

  // if()
  // Vector3.Cross()
  //vecN = Vector3.Scale(vecN,-1)

  // $\vec{v}_{rel} = \vec{v}_2 - \vec{v}_1$
  // 步骤二：求相对速度
  // 接触点上的相对速度 vrel 等于两球的线速度差，加上自转带来的线速度差。
  // $I = \frac{1}{2} m r^2$
  // (此处简化了角速度对碰撞点线速度的影响，以满足休闲游戏性能)

  let vecRel = gsts.f._3dVectorSubtraction(vec2, vec1)

  let CrossVec = Vector3.Cross(vecRel, Vector3.Sub(enterPos, startPos))
  if (Vector3.Magnitude(CrossVec) != 0) {
    // console.log("校准")
    // vecN = Vector3.Scale(vecN,-1)
    // vecRel = Vector3.Scale(vecRel,-1)
  } else {
    CrossVec = Vector3.Cross(Vector3.Scale(vecRel, -1), Vector3.Sub(selfPos, startPos))
  }

  //vecN = Vector3.Scale(vecN,-1)
  let vecT = gsts.f._3dVectorRotation([0, 90, 0], vecN) //切线向量
  if (CrossVec.y > 0) {
    let relRotate = -90
    vecT = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, relRotate, 0), vecN) //切线向量
  }

  //vecRel = gsts.f._3dVectorZoom(vecRel,-1)
  //转动惯量
  let I1 = 0.5 * mass_1 * Global.radius * Global.radius
  let I2 = 0.5 * mass_2 * Global.radius * Global.radius

  // 步骤三：计算法向冲量（反弹力 jnjn）
  //法向冲量
  let jn =
    ((1 + Global.e) * gsts.f._3dVectorDotProduct(vecRel, vecN) * -1) / (1 / mass_1 + 1 / mass_2)
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

  //at1 = Vector3.Scale(at1,-1)
  let v1 = gsts.f._3dVectorSubtraction(gsts.f._3dVectorSubtraction(vec1, an1), at1)

  gsts.f.setCustomVariable(entity_1, 'moveVec', v1)
  const omg1 = ((jt * Global.radius) / I1) * 30 * -1

  gsts.f.stopAndDeleteBasicMotionDevice(entity_1, '', true)
  gsts.f.addUniformBasicLinearMotionDevice(entity_1, 'forwardMove', 99, v1)

  let crossOmg1 = Vector3.Cross(v1, vecT)

  if (crossOmg1.y > 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_1, 'rotate', 99, omg1, [0, -1, 0])
  } else if (crossOmg1.y < 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_1, 'rotate', 99, omg1, [0, 1, 0])
  }

  gsts.f.startTimer(entity_1, Global.Tick_MoveActive, true, [0.03])
  gsts.f.startTimer(entity_1, Global.Tick_OutCheck, true, [0.03])

  let an2 = gsts.f._3dVectorZoom(vecN, jn / mass_2)
  let at2 = gsts.f._3dVectorZoom(vecT, jt / mass_2)
  let v2 = gsts.f._3dVectorAddition(vec2, gsts.f._3dVectorAddition(an2, at2))

  gsts.f.setCustomVariable(entity_2, 'moveVec', v2)

  gsts.f.stopAndDeleteBasicMotionDevice(entity_2, '', true)
  gsts.f.addUniformBasicLinearMotionDevice(entity_2, 'forwardMove', 99, v2)

  const omg2 = ((jt * Global.radius) / I2) * 30
  let crossOmg2 = Vector3.Cross(v2, vecT)

  if (crossOmg2.y > 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_2, 'rotate', 99, omg2, [0, -1, 0])
  } else if (crossOmg2.y < 0) {
    gsts.f.addUniformBasicRotationBasedMotionDevice(entity_2, 'rotate', 99, omg2, [0, 1, 0])
  }

  gsts.f.startTimer(entity_2, Global.Tick_MoveActive, true, [0.03])
  gsts.f.startTimer(entity_2, Global.Tick_OutCheck, true, [0.03])
}

// export function ErrorMsg(msg:string,player:entity)
// {
//   gstsServerErrorMsg(msg,player)
// }

export function gstsServerErrorMsg(msg: string, conplayer: entity, isMine: boolean) {
  conplayer.setUiControlStatus(1073742874n, UIControlGroupStatus.On)
  conplayer.setUiControlStatus(1073742471n, UIControlGroupStatus.On)
  //全屏动效
  conplayer.playUiAnimationOnControl(1073742871n)

  if (!isMine) {
    conplayer.setUiControlStatus(1073742872n, UIControlGroupStatus.On)
    conplayer.setUiControlStatus(1073742910n, UIControlGroupStatus.Off)
  } else {
    conplayer.setUiControlStatus(1073742872n, UIControlGroupStatus.Off)
    conplayer.setUiControlStatus(1073742910n, UIControlGroupStatus.On)
  }
  Global.getServerStageEntity().set('ErrorMsg', msg)
  setTimeout((e) => {
    conplayer.setUiControlStatus(1073742874n, UIControlGroupStatus.Off)
  }, 3000)
}

export function gstsServerErrorMsgNew(msg: string, conplayer: entity, isMine: boolean) {
  conplayer.setUiControlStatus(1073742874n, UIControlGroupStatus.On)
  conplayer.setUiControlStatus(1073742471n, UIControlGroupStatus.On)
  conplayer.setUiControlStatus(1073742872n, UIControlGroupStatus.Off)
  conplayer.setUiControlStatus(1073742910n, UIControlGroupStatus.Off)
  //全屏动效
  conplayer.playUiAnimationOnControl(1073742871n)

  Global.getServerStageEntity().set('ErrorMsg', msg)
  setTimeout((e) => {
    conplayer.setUiControlStatus(1073742874n, UIControlGroupStatus.Off)
  }, 3000)
}

/**
 * 获取真实碰撞点坐标
 * @param FirstShess
 * @param SecondChess
 * @returns
 */
export function gstsServerRealDir(FirstShess: entity, SecondChess: entity) {
  let startPos = Global.getServerStageEntity()
    .get('curPlayer')
    .asType('entity')
    .get('startPos')
    .asType('vec3')
  let isStart = FirstShess.get('isStart').asType('bool')
  let startchess = FirstShess
  let entChess = SecondChess
  if (!isStart) {
    startchess = SecondChess
    entChess = FirstShess
  }

  let movevec = startchess.get('moveVec').asType('vec3')
  let step1rad = Vector3.Angle(movevec, Vector3.Sub(entChess.pos, startPos))
  let Angle = gsts.f.radiansToDegrees(step1rad)
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

export function gstsServerGetInitSpeedFor(
  chessEntity: entity,
  chessType: string,
  pos: vec3,
  faction: faction
): number {
  let initSpeed = chessEntity.get('initSpeed').asType('float')

  if (faction == Global.factionRed) {
    if (pos.x < Global.Wall.center && chessType == '兵') {
      initSpeed = 25
    }
  }

  if (faction == Global.factionBlack) {
    if (pos.x > Global.Wall.center && chessType == '兵') {
      initSpeed = 25
    }
  }

  return initSpeed
}
