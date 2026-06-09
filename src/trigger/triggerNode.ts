import { g } from 'genshin-ts/runtime/core'
import { entity } from 'genshin-ts/runtime/value'

import { gstsServerAddMoveEntity } from '../ChangeControl'
import * as Global from '../Global'
import { gstsServerCalculateImpulse } from '../Tool'
import { gstsServerMoveChangeTick, gstsServerOutCheck } from './triggerFunction'

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
    enteringEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)
    selfEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)

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

    let list1 = f.getCustomVariable(enteringEntity, 'triggerGuidList').asType('entity_list')
    let list2 = f.getCustomVariable(selfEntity, 'triggerGuidList').asType('entity_list')

    let enterPieceType = enteringEntity.get('棋子类型').asType('str')
    let selfPieceType = self.get('棋子类型').asType('str')
    let enterTriCount = enteringEntity.get('triggerCount').asType('float')
    let selfTriCount = self.get('triggerCount').asType('float')
    let enterisStart = enteringEntity.get('isStart').asType('bool')
    let selfisStart = self.get('isStart').asType('bool')

    enteringEntity.set('triggerCount', enterTriCount + 1)
    self.set('triggerCount', selfTriCount + 1)

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
      f.setCustomVariable(enteringEntity, 'triggerGuidList', list1)
      f.setCustomVariable(selfEntity, 'triggerGuidList', list2)
      if (enterPieceType == '炮' && enterTriCount == 0 && enterisStart) {
        //炮的初始加速度
        let baseVec = Vector3.Normalize(enteringEntity.get('moveVec').asType('vec3'))
        //获取现在的速度*1.2
        let moveVec = Vector3.Scale(enteringEntity.get('moveVec').asType('vec3'), 1.2)
        //获取现在速度的模长
        let CurSpeedVecM = Vector3.Magnitude(moveVec)
        //基准速度向量
        let BaseInitSpeedVec = Vector3.Scale(
          baseVec,
          enteringEntity.get('initSpeed').asType('float')
        )
        //基准速度模长
        let BaseInitSpeedVecM = Vector3.Magnitude(BaseInitSpeedVec)
        //如果不满足基础速度模长条件 则直接转为基础速度
        if (CurSpeedVecM < BaseInitSpeedVecM) {
          moveVec = BaseInitSpeedVec
        }

        enteringEntity.set('moveVec', moveVec)
        gsts.f.addUniformBasicLinearMotionDevice(enteringEntity, 'forwardMove', 99, moveVec)
        //增加摩擦力影响速度变化
        gsts.f.startTimer(enteringEntity, Global.Tick_MoveActive, true, [0.03])
      } else if (selfPieceType == '炮' && selfTriCount == 0 && selfisStart) {
        //炮的初始加速度
        let baseVec = Vector3.Normalize(self.get('moveVec').asType('vec3'))
        //获取现在的速度*1.2
        let moveVec = Vector3.Scale(self.get('moveVec').asType('vec3'), 1.2)
        //获取现在速度的模长
        let CurSpeedVecM = Vector3.Magnitude(moveVec)
        //基准速度向量
        let BaseInitSpeedVec = Vector3.Scale(baseVec, self.get('initSpeed').asType('float'))
        //基准速度模长
        let BaseInitSpeedVecM = Vector3.Magnitude(BaseInitSpeedVec)
        //如果不满足基础速度模长条件 则直接转为基础速度
        if (CurSpeedVecM < BaseInitSpeedVecM) {
          moveVec = BaseInitSpeedVec
        }
        self.set('moveVec', moveVec)
        gsts.f.addUniformBasicLinearMotionDevice(self, 'forwardMove', 99, moveVec)
        //增加摩擦力影响速度变化
        gsts.f.startTimer(self, Global.Tick_MoveActive, true, [0.03])
      } else {
        gstsServerCalculateImpulse(enteringEntity, selfEntity)
      }
    }
  }
})

g.server({
  id: 1073741833,
  name: 'moveActChange'
}).on('whenTimerIsTriggered', (_evt, _f) => {
  if (_evt.timerName == Global.Tick_MoveActive) gstsServerMoveChangeTick(Global.deltaMove)
  else if (_evt.timerName == Global.Tick_OutCheck) gstsServerOutCheck(self)
  else if (_evt.timerName == Global.Tick_MoveActiveTriggerBefore)
    gstsServerMoveChangeTick(Global.deltaMoveTriggerBefore)
})
