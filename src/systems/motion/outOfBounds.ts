import { entity } from 'genshin-ts/runtime/value'

import { Wall } from '../../contracts/stage'
import { Tick_OutCheck } from '../../contracts/timers'

/**
 * 棋子出界判断
 */
export function gstsServerOutCheck(checkentity: entity) {
  if (
    checkentity.pos.z < Wall.leftz ||
    checkentity.pos.z > Wall.rightz ||
    checkentity.pos.x < Wall.topx ||
    checkentity.pos.x > Wall.bottomX
  ) {
    //幂等保护：出界检测定时器(0.03s循环)在棋子3秒后销毁前可能反复进入本分支，
    //同一枚子只处理一次出界，避免重复结算/重复落子动画/重复销毁。
    if (!checkentity.get('isOut').asType('bool')) {
      checkentity.set('isOut', true)
      //删除所有运动器
      gsts.f.stopAndDeleteBasicMotionDevice(checkentity, '', true)
      gsts.f.stopTimer(checkentity, Tick_OutCheck)

      if (checkentity.pos.z < Wall.leftz) {
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

      if (checkentity.pos.z > Wall.rightz) {
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

      if (checkentity.pos.x < Wall.topx) {
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

      if (checkentity.pos.x > Wall.bottomX) {
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
        //销毁棋子——销毁会触发关卡实体「实体销毁时」，将帅死亡 rematch 由 chessDestroy(1850) 接管
        capturedEntity.destroy()
      }, 3000)
    }
  }
}
