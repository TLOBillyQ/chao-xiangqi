import { g } from 'genshin-ts/runtime/core'
import { entity } from 'genshin-ts/runtime/value'

import { deltaMove, deltaMoveTriggerBefore } from '../../contracts/physics'
import { getServerStageEntity } from '../../contracts/stage'
import {
  Tick_MoveActive,
  Tick_MoveActiveTriggerBefore,
  Tick_OutCheck
} from '../../contracts/timers'
import { PieceVar, PlayerVar, StageVar } from '../../contracts/variables'
import { gstsServerApplyCannonLaunch, gstsServerCalculateImpulse } from '../../core/physics'
import { gstsServerMoveChangeTick } from '../../systems/motion/movement'
import { gstsServerOutCheck } from '../../systems/motion/outOfBounds'
import { gstsServerAddMoveEntity } from '../../systems/turn/turnState'

//九宫格范围检测
g.server({
  id: 1073741827,
  name: 'trigger'
}).on('whenOnHitDetectionIsTriggered', (_evt, f) => {
  //计算法线（即法向量）aw
  if (_evt.onHitHurtbox) {
    let enteringEntity = _evt.onHitEntity as entity
    let selfEntity = f.getSelfEntity()

    //移除当前移动前定时器
    enteringEntity.stopTimer(Tick_MoveActiveTriggerBefore)
    selfEntity.stopTimer(Tick_MoveActiveTriggerBefore)

    //添加特效
    enteringEntity.playTimedEffects(
      configId(1199570946),
      'GI_RootNode',
      true,
      true,
      [0, 0, 0],
      [0, 0, 0],
      1,
      true
    )
    selfEntity.playTimedEffects(
      configId(1199570946),
      'GI_RootNode',
      true,
      true,
      [0, 0, 0],
      [0, 0, 0],
      1,
      true
    )

    let list1 = f.getCustomVariable(enteringEntity, PieceVar.triggerGuidList).asType('entity_list')
    let list2 = f.getCustomVariable(selfEntity, PieceVar.triggerGuidList).asType('entity_list')

    let enterPieceType = enteringEntity.get(PieceVar.pieceType).asType('str')
    let selfPieceType = self.get(PieceVar.pieceType).asType('str')
    let enterTriCount = enteringEntity.get(PieceVar.triggerCount).asType('float')
    let selfTriCount = self.get(PieceVar.triggerCount).asType('float')
    let enterisStart = enteringEntity.get(PieceVar.isStart).asType('bool')
    let selfisStart = self.get(PieceVar.isStart).asType('bool')

    enteringEntity.set(PieceVar.triggerCount, enterTriCount + 1)
    self.set(PieceVar.triggerCount, selfTriCount + 1)

    gstsServerAddMoveEntity(enteringEntity)
    gstsServerAddMoveEntity(self)

    //碰撞时互相检测到对方的方法处理 添加到对方的当前碰撞列表当中
    let isCanTrigger = 1

    if (
      // eslint-disable-next-line gsts/list-method-type-constraints
      list1.includes(selfEntity)
    ) {
      isCanTrigger = 0
    }
    if (
      // eslint-disable-next-line gsts/list-method-type-constraints
      list2.includes(enteringEntity)
    ) {
      isCanTrigger = 0
    }

    if (isCanTrigger == 1) {
      // eslint-disable-next-line gsts/list-method-type-constraints
      list1.push(selfEntity)
      // eslint-disable-next-line gsts/list-method-type-constraints
      list2.push(enteringEntity)
      f.setCustomVariable(enteringEntity, PieceVar.triggerGuidList, list1)
      f.setCustomVariable(selfEntity, PieceVar.triggerGuidList, list2)
      if (enterPieceType == '炮' && enterTriCount == 0 && enterisStart) {
        gstsServerApplyCannonLaunch(enteringEntity)
      } else if (selfPieceType == '炮' && selfTriCount == 0 && selfisStart) {
        gstsServerApplyCannonLaunch(self)
      } else {
        let startPos = getServerStageEntity()
          .get(StageVar.curPlayer)
          .asType('entity')
          .get(PlayerVar.startPos)
          .asType('vec3')
        gstsServerCalculateImpulse(enteringEntity, selfEntity, startPos)
      }
    }
  }
})

g.server({
  id: 1073741833,
  name: 'moveActChange'
}).on('whenTimerIsTriggered', (_evt, _f) => {
  if (_evt.timerName == Tick_MoveActive) gstsServerMoveChangeTick(deltaMove)
  else if (_evt.timerName == Tick_OutCheck) gstsServerOutCheck(self)
  else if (_evt.timerName == Tick_MoveActiveTriggerBefore)
    gstsServerMoveChangeTick(deltaMoveTriggerBefore)
})
