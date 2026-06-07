import { g } from 'genshin-ts/runtime/core'

import * as Global from '../Global'
import { gstsServerCalSelfReflectVec } from '../Tool'

g.server({
  id: 1073741834,
  name: 'ChessCreate'
}).on('whenEntityIsCreated', (_evt, _f) => {
  //初始化撞击次数
  self.set('triggerCount', float(0))
  self.set('isStart', false)
})

//九宫格范围检测
g.server({
  id: 1073741835,
  name: 'NineCeilWall'
}).on('whenOnHitDetectionIsTriggered', (_evt, _f) => {
  if (_evt.onHitHurtbox) {
    //只有初始对象才能被反弹
    if (_evt.onHitEntity.get('isStart').asType('bool')) {
      let FA = self.get('FA').asType('vec3')
      let newVec = gstsServerCalSelfReflectVec(_evt.onHitEntity.get('moveVec').asType('vec3'), FA)

      Global.gstsServerGetStageEntity()
        .get('curPlayer')
        .asType('entity')
        .set('startPos', _evt.onHitLocation)
      _evt.onHitEntity.set('moveVec', newVec)

      gsts.f.addUniformBasicLinearMotionDevice(_evt.onHitEntity, 'forwardMove', 99, newVec)
    }
  }
})
