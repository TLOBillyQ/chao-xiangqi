import { entity, vec3 } from 'genshin-ts/runtime/value'

import * as Global from '../Global'
import * as Settle from '../settlement/settleFunction'

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

    self.stopTimer(Global.Tick_MoveActive)
    self.stopTimer(Global.Tick_MoveActiveTriggerBefore)
    self.stopTimer(Global.Tick_OutCheck)
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
  //damping = Global.deltaMove
  const newSpeed = Vector3.Scale(oldSpeed, 1 - Global.deltaT * damping)
  return newSpeed
}

/**
 * 棋子出界判断
 */
export function gstsServerOutCheck(checkentity: entity) {
  if (
    checkentity.pos.z < Global.Wall.leftz ||
    checkentity.pos.z > Global.Wall.rightz ||
    checkentity.pos.x < Global.Wall.topx ||
    checkentity.pos.x > Global.Wall.floorx
  ) {
    //幂等保护：出界检测定时器(0.03s循环)在棋子3秒后销毁前可能反复进入本分支，
    //同一枚子只处理一次出界，避免重复结算/重复落子动画/重复销毁。
    if (checkentity.get('isOut').asType('bool')) {
    } else {
      checkentity.set('isOut', true)
      let _qiziType = checkentity.get('棋子类型').asType('str')
      let _chessFaction = gsts.f.queryEntityFaction(checkentity)
      //将/帅被吃（出界）即终局：记录是否为王、以及被吃方是否红方
      let isKing = _qiziType == '帅' || _qiziType == '将'
      let redIsLoser = _chessFaction == Global.factionRed
      //获取拥有者实体
      let _ownerEntity = checkentity.owner()
      //删除所有运动器
      gsts.f.stopAndDeleteBasicMotionDevice(checkentity, '', true)
      gsts.f.stopTimer(checkentity, Global.Tick_OutCheck)

      if (checkentity.pos.z < Global.Wall.leftz) {
        //左侧掉落
        const newvec = gsts.f._3dVectorRotation(
          gsts.f.create3dVector(0, 0, checkentity.rotation.y * -1),
          gsts.f._3dVectorRotation(gsts.f.create3dVector(-90, 0, 0), Vector3.forward)
        )
        gsts.f.addTargetOrientedRotationBasedMotionDevice(
          checkentity,
          'as',
          1,
          gsts.f.directionVectorToRotation(newvec, Vector3.back)
        )
      }

      if (checkentity.pos.z > Global.Wall.rightz) {
        //右侧掉落
        const newvec = gsts.f._3dVectorRotation(
          gsts.f.create3dVector(0, 0, checkentity.rotation.y),
          gsts.f._3dVectorRotation(gsts.f.create3dVector(90, 0, 0), Vector3.forward)
        )
        gsts.f.addTargetOrientedRotationBasedMotionDevice(
          checkentity,
          'as',
          1,
          gsts.f.directionVectorToRotation(newvec, Vector3.forward)
        )
      }

      if (checkentity.pos.x < Global.Wall.topx) {
        //上侧掉落
        const newvec = gsts.f._3dVectorRotation(
          gsts.f.create3dVector(checkentity.rotation.y * -1, 0, 0),
          Vector3.forward
        )
        gsts.f.addTargetOrientedRotationBasedMotionDevice(
          checkentity,
          'as',
          1,
          gsts.f.directionVectorToRotation(newvec, Vector3.left)
        )
      }

      if (checkentity.pos.x > Global.Wall.floorx) {
        //下侧掉落
        const newvec = gsts.f._3dVectorRotation(
          gsts.f.create3dVector(checkentity.rotation.y, 0, 0),
          Vector3.forward
        )
        gsts.f.addTargetOrientedRotationBasedMotionDevice(
          checkentity,
          'as',
          1,
          gsts.f.directionVectorToRotation(newvec, Vector3.right)
        )
      }

      const capturedEntity = checkentity
      setTimeout((_e) => {
        //下落效果
        gsts.f.addUniformBasicLinearMotionDevice(
          capturedEntity,
          'draw',
          2,
          Vector3.Scale(Vector3.down, 3)
        )
        capturedEntity.playTimedEffects(
          configId(1199570947),
          'GI_RootNode',
          true,
          true,
          [0, 0, 0],
          [0, 0, 0],
          1,
          true
        )
      }, 1000)
      setTimeout((_e) => {
        //销毁棋子
        //checkentity.activateDisableModelDisplay(false)
        capturedEntity.destroy()
        //若被吃的是将/帅，落子动画结束后结算：被吃方判负、对方判胜
        if (isKing) {
          if (redIsLoser) {
            Settle.gstsServerSettleGame(false)
          } else {
            Settle.gstsServerSettleGame(true)
          }
        }
      }, 3000)
    }
  }
}
