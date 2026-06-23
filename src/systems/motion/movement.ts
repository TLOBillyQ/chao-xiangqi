import { vec3 } from 'genshin-ts/runtime/value'

import { contactSeparation, deltaT } from '../../contracts/physics'
import {
  Tick_MoveActive,
  Tick_MoveActiveTriggerBefore,
  Tick_OutCheck
} from '../../contracts/timers'
import { PieceVar } from '../../contracts/variables'

/**
 * 速度插值结算定时器
 */
export function gstsServerMoveChangeTick(damping: number) {
  let oldSpeed = self.get(PieceVar.moveVec).asType('vec3')
  //如果速度小于0.1则停止运动
  if (Vector3.Magnitude(oldSpeed) <= 0.1) {
    self.stopAndDeleteBasicMotionDevice('', true)
    self.set(PieceVar.triggerCount, 0)
    self.set(PieceVar.isStart, false)
    self.set(PieceVar.moveVec, [0, 0, 0])
    let list = self.get(PieceVar.triggerGuidList).asType('entity_list')
    gsts.f.clearList(list)
    self.set<'entity_list'>(PieceVar.triggerGuidList, list)
    self.clearSpecialEffectsBasedOnSpecialEffectAssets(configId(1199570948))

    self.stopTimer(Tick_MoveActive)
    self.stopTimer(Tick_MoveActiveTriggerBefore)
    self.stopTimer(Tick_OutCheck)
    //从列表里移除
    //gstsServerRemoveMoveEntity(self)
  } else {
    //分离重整：把已脱离接触的对象从去重列表剔除，让真正的二次碰撞能重新触发
    gstsServerPruneSeparatedTriggers()
    const newSpeed = LerpSpeed(oldSpeed, damping)
    gsts.f.setCustomVariable(self, PieceVar.moveVec, newSpeed)
    self.addUniformBasicLinearMotionDevice('forwardMove', 99, newSpeed)
  }
}

/**
 * 碰撞去重列表的分离重整。
 *
 * 旧逻辑只在棋子停下（速度≤0.1）时清「自己」那半边 triggerGuidList，而拦截判定是
 * 对两条列表的「或」门——任一残留条目都会否决一次本该发生的碰撞。当一方先停下、另一方
 * 仍在动时，仍在动的一方手里指向已停子的反向条目永不被清，下一次靠拢就被误拦、不施加
 * 分离冲量，导致棋子互相穿插叠在一起。
 *
 * 这里改为按「分离距离」重整：每个仍在运动的棋子在自己的 MoveActive tick 里，把
 * triggerGuidList 中与自己中心距已超过 contactSeparation（=两倍半径）的对象剔除。
 * 因为分离是双向的，双方各自在自己的 tick 里剔除对方，无需跨实体写入——既规避了
 * entity== set/get 往返不可靠（无法可靠地从别人的列表里按句柄删自己），也让同一对棋子
 * 在真正分开后能再次触发碰撞（修复回合内二次碰撞被无条件拦截）。
 *
 * 每 tick 至多剔除一个（与 turnState 的 moveList 剔除同一惯用法，break 后由后续 tick
 * 继续清剩余项）；ticks 间隔约 0.03s、列表通常 1~3 项，几 tick 内即清空，远早于棋子
 * 反向折返再次靠拢。幂等，适配节点图计时器约 2× 重入（重复回调扫到的是已收缩的列表）。
 */
export function gstsServerPruneSeparatedTriggers() {
  let list = self.get(PieceVar.triggerGuidList).asType('entity_list')
  for (let i = 0; i < list.length; i++) {
    let other = list[i]
    if (Vector3.Magnitude(Vector3.Sub(self.pos, other.pos)) > contactSeparation) {
      gsts.f.removeValueFromList(list, i)
      self.set<'entity_list'>(PieceVar.triggerGuidList, list)
      break
    }
  }
}

//匀速插值变化
function LerpSpeed(oldSpeed: vec3, damping: number): vec3 {
  //
  const newSpeed = Vector3.Scale(oldSpeed, 1 - deltaT * damping)
  return newSpeed
}
