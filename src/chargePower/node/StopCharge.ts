import { g } from 'genshin-ts/runtime/core'

import { gstsServerConfirmAndMovePiece } from '../../chessEntity/chessObjFunction'
import { dirPrefabs } from '../../Global'
import { Signal } from '../../resources/signals'
import { gstsServerHideUIByChargeStop } from '../../UIControl/ControlUIFunc'

g.server({
  id: 1073741838,
  name: 'StopCharge'
}).onSignal(Signal.StopCharge, (_evt, f) => {
  let isForSelf = false
  if (_evt.signalSourceEntity == self) {
    isForSelf = true
  } else {
    let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
    if (entity == self) isForSelf = true
  }
  print(str('CHARGE_STOP_RECV'))
  if (isForSelf) {
    print(str('CHARGE_STOP_SELF'))
    if (self.get('ischarge').asType('bool')) {
      let powerPercent = f.getCustomVariable(self, 'chargePower').asType('float') / 100
      print(str(powerPercent))
      //send('MoveForward')

      //销毁自身所有方向实体
      let tagPrefabListRed = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red)

      while (tagPrefabListRed.length > 0) {
        if (
          self.get('curDirIndex').asType('float') ==
          tagPrefabListRed[tagPrefabListRed.length - 1].get('dirUIIndex').asType('float')
        ) {
          //通知棋子移动
          gstsServerConfirmAndMovePiece(
            tagPrefabListRed[tagPrefabListRed.length - 1],
            powerPercent,
            self
          )
        }
        gsts.f.destroyEntity(tagPrefabListRed[tagPrefabListRed.length - 1])
      }

      let tagPrefabListBlack = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black)
      while (tagPrefabListBlack.length > 0) {
        if (
          self.get('curDirIndex').asType('float') ==
          tagPrefabListBlack[tagPrefabListBlack.length - 1].get('dirUIIndex').asType('float')
        ) {
          //通知棋子移动
          gstsServerConfirmAndMovePiece(
            tagPrefabListBlack[tagPrefabListBlack.length - 1],
            powerPercent,
            self
          )
        }
        gsts.f.destroyEntity(tagPrefabListBlack[tagPrefabListBlack.length - 1])
      }

      //清理自身变量
      self.set('curDirIndex', 999)
      self.set('curChooseChess', self)
      self.set('isControl', false)

      //更新玩家步数
      let step = self.get('step').asType('float')
      let updateStep = step + 1
      self.set('step', updateStep)

      f.setCustomVariable(self, 'ischarge', false)
      f.stopTimer(self, 'charge')
      f.setCustomVariable(self, 'chargePower', 0)

      //UI控制
      gstsServerHideUIByChargeStop(self)
    } else {
      print(str('CHARGE_STOP_NOTCHARGING'))
    }
  }
})
