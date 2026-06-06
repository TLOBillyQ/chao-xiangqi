import { g } from 'genshin-ts/runtime/core'
import { gstsServerGetInitSpeedFor, gstsServerVec3ToVec2 } from '../Tool'
import type { entity, float, vec3 } from 'genshin-ts/runtime/value'
import * as Global from '../Global'
import { gstsServerAddMoveEntity } from '../ChangeControl'
import { PlayerEntity } from 'genshin-ts/definitions/nodes'


//选定方向后移动
export function gstsServerSureToMove(dirEntity:entity,powerPercent:number,curPlayer:PlayerEntity)
{
  let motherEntity = gsts.f.getOwnerEntity(dirEntity)
  let moveVec = gsts.f.getCustomVariable(dirEntity,"moveVec").asType("vec3")
  let relVec = gstsServerVec3ToVec2(moveVec)
  motherEntity.set("isStart",true)
  motherEntity.mountLoopingSpecialEffect(configId(1199570948),"GI_RootNode",true,true,[0,0,0],[0,0,0],1,true)
  
  //往移动列表里加入实体
  gstsServerAddMoveEntity(motherEntity)
  //记录出发初始坐标
  curPlayer.set("startPos",motherEntity.pos)
  curPlayer.set("isControl",false)

  //清理光效
  gsts.f.clearSpecialEffectsBasedOnSpecialEffectAssets(motherEntity.get("ScanEntity").asType("entity"),configId(10010010))
  

  let chessType = motherEntity.get("棋子类型").asType("str")
  let Mass = motherEntity.get("Mass").asType("float")
  let initSpeed = gstsServerGetInitSpeedFor(motherEntity, chessType, motherEntity.pos, motherEntity.faction())


  gsts.f.setCustomVariable(motherEntity,"moveVec",gsts.f._3dVectorZoom(relVec,initSpeed*powerPercent))
  gsts.f.addUniformBasicLinearMotionDevice(motherEntity,"forwardMove",99,gsts.f._3dVectorZoom(relVec,initSpeed*powerPercent))
  gsts.f.startTimer(motherEntity,Global.Tick_MoveActiveTriggerBefore,true,[0.03])
  gsts.f.startTimer(motherEntity,Global.Tick_OutCheck,true,[0.03])
}

// g.server({
//   id: 1073741830,
//   name:'qiziMove'
// }).on(
//    'whenEntityIsCreated', (_evt, f) => {
//     //f.setScanComponentSActiveScanTagId(f.getSelfEntity(),2)
//    })
