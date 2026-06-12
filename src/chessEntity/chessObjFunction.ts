import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import type { entity } from 'genshin-ts/runtime/value'

import { gstsServerAddMoveEntity } from '../ChangeControl'
import * as Global from '../Global'
import { gstsServerVec3ToVec2 } from '../Tool'

//选定方向后移动
export function gstsServerConfirmAndMovePiece(
  dirEntity: entity,
  powerPercent: number,
  curPlayer: PlayerEntity
) {
  let motherEntity = gsts.f.getOwnerEntity(dirEntity)
  let moveVec = gsts.f.getCustomVariable(dirEntity, 'moveVec').asType('vec3')
  let relVec = gstsServerVec3ToVec2(moveVec)
  //发射随机偏差 ±AngleRand°（关卡实体整型自定义变量，编辑器默认值5），存储的moveVec与运动器共用偏转后的同一向量，碰撞物理保持一致
  let angleRand = float(Global.getServerStageEntity().get('AngleRand').asType('int'))
  let deviation = gsts.f.getRandomFloatingPointNumber(0 - angleRand, angleRand)
  relVec = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, deviation, 0), relVec)
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

  let pieceType = motherEntity.get('棋子类型').asType('str')
  let _Mass = motherEntity.get('Mass').asType('float')

  let initSpeed = motherEntity.get('initSpeed').asType('float')
  let Faction = motherEntity.faction()
  let pos = motherEntity.pos

  //兵过河后 初速度会变化
  if (Faction == Global.factionRed) {
    if (pos.x < Global.Wall.center && pieceType == '兵') {
      initSpeed = 25
    }
  }

  if (Faction == Global.factionBlack) {
    if (pos.x > Global.Wall.center && pieceType == '兵') {
      initSpeed = 25
    }
  }

  gsts.f.setCustomVariable(
    motherEntity,
    'moveVec',
    gsts.f._3dVectorZoom(relVec, initSpeed * powerPercent)
  )
  gsts.f.addUniformBasicLinearMotionDevice(
    motherEntity,
    'forwardMove',
    99,
    gsts.f._3dVectorZoom(relVec, initSpeed * powerPercent)
  )
  gsts.f.startTimer(motherEntity, Global.Tick_MoveActiveTriggerBefore, true, [0.03])
  gsts.f.startTimer(motherEntity, Global.Tick_OutCheck, true, [0.03])
}
