import { vec3 } from 'genshin-ts/runtime/value'

import { deltaT } from '../../contracts/physics'
import {
  Tick_MoveActive,
  Tick_MoveActiveTriggerBefore,
  Tick_OutCheck
} from '../../contracts/timers'

/**
 * 速度插值结算定时器
 */
export function gstsServerMoveChangeTick(damping: number) {
  let oldSpeed = self.get('moveVec').asType('vec3')
  //如果速度小于0.1则停止运动
  if (Vector3.Magnitude(oldSpeed) <= 0.1) {
    self.stopAndDeleteBasicMotionDevice('', true)
    self.set('triggerCount', 0)
    self.set('isStart', false)
    self.set('moveVec', [0, 0, 0])
    let list = self.get('triggerGuidList').asType('entity_list')
    gsts.f.clearList(list)
    self.set<'entity_list'>('triggerGuidList', list)
    self.clearSpecialEffectsBasedOnSpecialEffectAssets(configId(1199570948))

    self.stopTimer(Tick_MoveActive)
    self.stopTimer(Tick_MoveActiveTriggerBefore)
    self.stopTimer(Tick_OutCheck)
    //从列表里移除
    //gstsServerRemoveMoveEntity(self)
  } else {
    const newSpeed = LerpSpeed(oldSpeed, damping)
    gsts.f.setCustomVariable(self, 'moveVec', newSpeed)
    self.addUniformBasicLinearMotionDevice('forwardMove', 99, newSpeed)
  }
}

//匀速插值变化
function LerpSpeed(oldSpeed: vec3, damping: number): vec3 {
  //
  const newSpeed = Vector3.Scale(oldSpeed, 1 - deltaT * damping)
  return newSpeed
}
