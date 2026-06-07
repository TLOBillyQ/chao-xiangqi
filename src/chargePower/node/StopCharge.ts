import { g } from 'genshin-ts/runtime/core'
import { gstsServerSureToMove } from '../../chessEntity/chessObjFunction'
import * as Global from '../../Global'
import { dirPrefabs } from '../../Global'
import { gstsServerHideUIByChargeStop } from '../../UIControl/ControlUIFunc'
import { Signal } from '../../resources/signals'

g.server({
  id: 1073741838,
  name: 'StopCharge'
}).onSignal(Signal.StopCharge, (_evt, f) => {

  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if(entity == self)
  {
    if(entity.get("ischarge").asType("bool"))
    {
      //let curDirEntity = f.getCustomVariable(entity,"curDirEntity").asType("entity")
      let powerPercent = f.getCustomVariable(entity,"chargePower").asType("float")/100
      //send('MoveForward')


      //销毁自身所有方向实体
      //f.destroyEntity(curDirEntity)
      let tagPrefabListRed = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red);

      while(tagPrefabListRed.length > 0)
      {
        if(self.get("curDirIndex").asType("float") == tagPrefabListRed[tagPrefabListRed.length-1].get("dirUIIndex").asType("float"))
        {
            //通知棋子移动
            gstsServerSureToMove( tagPrefabListRed[tagPrefabListRed.length-1],powerPercent,self)
        }
        gsts.f.destroyEntity(tagPrefabListRed[tagPrefabListRed.length-1])
      }



      let tagPrefabListBlack = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black);
      while(tagPrefabListBlack.length > 0)
      {
        if(self.get("curDirIndex").asType("float") == tagPrefabListBlack[tagPrefabListBlack.length-1].get("dirUIIndex").asType("float"))
        {
            //通知棋子移动
            gstsServerSureToMove(tagPrefabListBlack[tagPrefabListBlack.length-1],powerPercent,self)
        }
        gsts.f.destroyEntity(tagPrefabListBlack[tagPrefabListBlack.length-1])
      }

      let trajList = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(Global.trajectoryPrefabId)
      while(trajList.length > 0) {
        gsts.f.destroyEntity(trajList[trajList.length-1])
      }

      //清理自身变量
      self.set("curDirIndex",999)
      self.set("curChooseChess",self)
      self.set("isControl",false)

      //更新玩家步数
      let step = self.get("step").asType("float")
      let updateStep = step+1
      self.set("step",updateStep)


      f.setCustomVariable(entity, 'ischarge', false)
      f.stopTimer(entity, 'charge')
      f.setCustomVariable(entity, 'chargePower', 0)

      //UI控制
      gstsServerHideUIByChargeStop(self)
    }
  }
})
