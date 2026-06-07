import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import type { entity } from 'genshin-ts/runtime/value'

import { gstsServerAddMoveEntity } from '../ChangeControl'
import * as Global from '../Global'
import { gstsServerGetInitSpeedFor, gstsServerVec3ToVec2 } from '../Tool'

//选定方向后移动
export function gstsServerSureToMove(
  dirEntity: entity,
  powerPercent: number,
  curPlayer: PlayerEntity
) {
  let motherEntity = gsts.f.getOwnerEntity(dirEntity)
  let moveVec = gsts.f.getCustomVariable(dirEntity, 'moveVec').asType('vec3')
  let relVec = gstsServerVec3ToVec2(moveVec)
  motherEntity.set('isStart', true)
  motherEntity.mountLoopingSpecialEffect(
    configId(1199570948),
    'GI_RootNode',
    true,
    true,
    [0, 0, 0],
    [0, 0, 0],
    1,
    true
  )

  //往移动列表里加入实体
  gstsServerAddMoveEntity(motherEntity)
  //记录出发初始坐标
  curPlayer.set('startPos', motherEntity.pos)
  curPlayer.set('isControl', false)

  //清理光效
  gsts.f.clearSpecialEffectsBasedOnSpecialEffectAssets(
    motherEntity.get('ScanEntity').asType('entity'),
    configId(10010010)
  )

  let chessType = motherEntity.get('棋子类型').asType('str')
  let initSpeed = gstsServerGetInitSpeedFor(
    motherEntity,
    chessType,
    motherEntity.pos,
    motherEntity.faction()
  )

  // ±1° 随机偏移，产生「手指弹」手感。绕世界Y轴旋转，在水平面内偏移。
  // 注意：偏移后的 finalRelVec 同时用于 moveVec 自定义变量和运动器，保持一致性。
  const offsetDeg = (Math.random() - 0.5) * 2.0
  const finalRelVec = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, offsetDeg, 0), relVec)

  gsts.f.setCustomVariable(
    motherEntity,
    'moveVec',
    gsts.f._3dVectorZoom(finalRelVec, initSpeed * powerPercent)
  )
  gsts.f.addUniformBasicLinearMotionDevice(
    motherEntity,
    'forwardMove',
    99,
    gsts.f._3dVectorZoom(finalRelVec, initSpeed * powerPercent)
  )
  gsts.f.startTimer(motherEntity, Global.Tick_MoveActiveTriggerBefore, true, [0.03])
  gsts.f.startTimer(motherEntity, Global.Tick_OutCheck, true, [0.03])
}
