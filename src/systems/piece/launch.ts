import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import type { entity } from 'genshin-ts/runtime/value'

import { getServerStageEntity } from '../../contracts/stage'
import { Tick_MoveActiveTriggerBefore, Tick_OutCheck } from '../../contracts/timers'
import { DirectionVar, PieceVar, PlayerVar, StageVar } from '../../contracts/variables'
import { gstsServerVec3ToVec2 } from '../../core/vector'
import { gstsServerAddMoveEntity } from '../turn/turnState'
import { gstsServerEffectiveInitSpeed } from './directions'

//选定方向后移动
export function gstsServerConfirmAndMovePiece(
  dirEntity: entity,
  powerPercent: number,
  curPlayer: PlayerEntity
) {
  let motherEntity = gsts.f.getOwnerEntity(dirEntity)
  let moveVec = gsts.f.getCustomVariable(dirEntity, DirectionVar.moveVec).asType('vec3')
  let relVec = gstsServerVec3ToVec2(moveVec)
  //发射随机偏差 ±AngleRand°（关卡实体整型自定义变量，编辑器默认值5），存储的moveVec与运动器共用偏转后的同一向量，碰撞物理保持一致
  let angleRand = float(getServerStageEntity().get(StageVar.angleRand).asType('int'))
  let deviation = gsts.f.getRandomFloatingPointNumber(0 - angleRand, angleRand)
  relVec = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, deviation, 0), relVec)
  motherEntity.set(PieceVar.isStart, true)
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
  curPlayer.set(PlayerVar.startPos, motherEntity.pos)
  curPlayer.set(PlayerVar.isControl, false)

  //清理光效
  gsts.f.clearSpecialEffectsBasedOnSpecialEffectAssets(
    motherEntity.get(PieceVar.scanEntity).asType('entity'),
    configId(10010010)
  )

  let _mass = motherEntity.get(PieceVar.mass).asType('float')
  //兵过河后初速度会变化：与落点预览共用 gstsServerEffectiveInitSpeed，确保预测落点与实际一致。
  let initSpeed = gstsServerEffectiveInitSpeed(motherEntity)

  gsts.f.setCustomVariable(
    motherEntity,
    PieceVar.moveVec,
    gsts.f._3dVectorZoom(relVec, initSpeed * powerPercent)
  )
  gsts.f.addUniformBasicLinearMotionDevice(
    motherEntity,
    'forwardMove',
    99,
    gsts.f._3dVectorZoom(relVec, initSpeed * powerPercent)
  )
  gsts.f.startTimer(motherEntity, Tick_MoveActiveTriggerBefore, true, [0.03])
  gsts.f.startTimer(motherEntity, Tick_OutCheck, true, [0.03])
}

/**
 * 发射后清理玩家蓄力/选子状态：复位选中方向、交还操作权、累加步数、关闭蓄力。
 * StopCharge 调用这一处，避免节点入口承担回合记账。
 */
export function gstsServerFinishLaunch(curPlayer: entity) {
  curPlayer.set(PlayerVar.curDirIndex, 999)
  curPlayer.set(PlayerVar.curChooseChess, curPlayer)
  curPlayer.set(PlayerVar.isControl, false)

  let step = curPlayer.get(PlayerVar.step).asType('float')
  curPlayer.set(PlayerVar.step, step + 1)

  gsts.f.setCustomVariable(curPlayer, PlayerVar.isCharge, false)
  gsts.f.stopTimer(curPlayer, 'charge')
  gsts.f.setCustomVariable(curPlayer, PlayerVar.chargePower, 0)
}
