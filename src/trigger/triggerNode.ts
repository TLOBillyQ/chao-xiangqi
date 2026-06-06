import { g } from 'genshin-ts/runtime/core'
import { entity } from 'genshin-ts/runtime/value'

import * as Global from '../Global'
import { gstsServerCaliImpulse} from '../Tool'
import { gstsServerMoveChangeTick, gstsServerOutCheck } from './triggerFunction'
import { gstsServerAddMoveEntity } from '../ChangeControl'



g.server({
  id: 1073741827,
  name:'trigger'
}).on('whenEnteringCollisionTrigger', (_evt, f) => {
    //计算法线（即法向量）aw
    // let enteringEntity = _evt.enteringEntity as entity
    // let enterPos = f.getEntityLocationAndRotation(enteringEntity).location
    // let selfEntity = f.getSelfEntity()
    // let selfPos = f.getEntityLocationAndRotation(selfEntity).location
    // let vecFa = f._3dVectorSubtraction(selfPos,enterPos)
    // let moveVec = f.getCustomVariable(selfEntity,"moveVec").asType("vec3")
    // let reflect‌Vec = gstsCalselfreflect‌Vec(moveVec,vecFa)

    // console.log(reflect‌Vec)
    // f.stopAndDeleteBasicMotionDevice(selfEntity,"forwardMove",false)
    // f.addUniformBasicLinearMotionDevice(selfEntity,"reflectMove",3,reflect‌Vec)
    
})


//九宫格范围检测
g.server({
  id: 1073741827,
  name:'trigger'
}).on('whenOnHitDetectionIsTriggered', (_evt, f) => {
      //计算法线（即法向量）aw
    if(_evt.onHitHurtbox)
    {
      let enteringEntity = _evt.onHitEntity as entity
      let selfEntity = f.getSelfEntity()

      //移除当前移动前定时器
      enteringEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)
      selfEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)

      //添加特效
      enteringEntity.playTimedEffects(configId(1199570946),"GI_RootNode",true,true,[0,0,0],[0,0,0],1,true)
      selfEntity.playTimedEffects(configId(1199570946),"GI_RootNode",true,true,[0,0,0],[0,0,0],1,true)

      let list1 = f.getCustomVariable(enteringEntity,"triggerGuidList").asType("entity_list")
      let list2 = f.getCustomVariable(selfEntity,"triggerGuidList").asType("entity_list")

      // let list1GUID = f.queryGuidByEntity(enteringEntity)
      // let list2GUID = f.queryGuidByEntity(selfEntity)

      let enterType = enteringEntity.get("棋子类型").asType("str")
      let selfType = self.get("棋子类型").asType("str")
      let enterTriCount = enteringEntity.get("triggerCount").asType("float")
      let selfTriCount = self.get("triggerCount").asType("float")
      let enterisStart = enteringEntity.get("isStart").asType("bool")
      let selfisStart = self.get("isStart").asType("bool")

      enteringEntity.set("triggerCount",enterTriCount+1)
      self.set("triggerCount",selfTriCount+1)
      
      gstsServerAddMoveEntity(enteringEntity)
      gstsServerAddMoveEntity(self)

      //碰撞时互相检测到对方的方法处理 添加到对方的当前碰撞列表当中
      let isCanTrigger = 1
       

      if(list1.includes(selfEntity)) {isCanTrigger = 0}
      if(list2.includes(enteringEntity)) {isCanTrigger = 0}

      if(isCanTrigger == 1){
        list1.push(selfEntity)
        list2.push(enteringEntity)
        f.setCustomVariable(enteringEntity,"triggerGuidList",list1)
        f.setCustomVariable(selfEntity,"triggerGuidList",list2)
        if((enterType =="炮"&& enterTriCount == 0 && enterisStart))
        { //炮的初始加速度
          let baseVec = Vector3.Normalize(enteringEntity.get("moveVec").asType("vec3"))
          //获取现在的速度*1.2
          let moveVec = Vector3.Scale(enteringEntity.get("moveVec").asType("vec3"),1.2)
          //获取现在速度的模长
          let CurSpeedVecM = Vector3.Magnitude(moveVec)
          //基准速度向量
          let BaseInitSpeedVec = Vector3.Scale(baseVec,enteringEntity.get("initSpeed").asType("float"))
          //基准速度模长
          let BaseInitSpeedVecM = Vector3.Magnitude(BaseInitSpeedVec)
          //如果不满足基础速度模长条件 则直接转为基础速度
          if (CurSpeedVecM < BaseInitSpeedVecM)
          {
              moveVec = BaseInitSpeedVec
          }

          enteringEntity.set("moveVec",moveVec)
          gsts.f.addUniformBasicLinearMotionDevice(enteringEntity,"forwardMove",99,moveVec)
          //增加摩擦力影响速度变化
          gsts.f.startTimer(enteringEntity, Global.Tick_MoveActive, true, [0.03])
        }else if((selfType =="炮"&& selfTriCount == 0 && selfisStart))
          
        { //炮的初始加速度
          let baseVec = Vector3.Normalize(self.get("moveVec").asType("vec3"))
          //获取现在的速度*1.2
          let moveVec = Vector3.Scale(self.get("moveVec").asType("vec3"),1.2)
          //获取现在速度的模长
          let CurSpeedVecM = Vector3.Magnitude(moveVec)
          //基准速度向量
          let BaseInitSpeedVec = Vector3.Scale(baseVec,self.get("initSpeed").asType("float"))
          //基准速度模长
          let BaseInitSpeedVecM = Vector3.Magnitude(BaseInitSpeedVec)
          //如果不满足基础速度模长条件 则直接转为基础速度
          if (CurSpeedVecM < BaseInitSpeedVecM)
          {
              moveVec = BaseInitSpeedVec
          }
          self.set("moveVec",moveVec)
          gsts.f.addUniformBasicLinearMotionDevice(self,"forwardMove",99,moveVec)
          //增加摩擦力影响速度变化
          gsts.f.startTimer(self, Global.Tick_MoveActive, true, [0.03])
        }
        else
        {
          gstsServerCaliImpulse(enteringEntity,selfEntity)
        }
      }else
      {
        //console.log("重复碰撞屏蔽")
      }
    }
})



// g.server({
//   id: 1073741827,
//   name:'trigger'
// }).on('whenEnteringCollisionTrigger', (_evt, f) => {
//     //计算法线（即法向量）aw
//     let enteringEntity = _evt.enteringEntity as entity
//     let selfEntity = f.getSelfEntity()

//     //移除当前移动前定时器
//     enteringEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)
//     selfEntity.stopTimer(Global.Tick_MoveActiveTriggerBefore)

//     let list1 = f.getCustomVariable(enteringEntity,"triggerGuidList").asType("guid_list")
//     let list2 = f.getCustomVariable(selfEntity,"triggerGuidList").asType("guid_list")

//     let list1GUID = f.queryGuidByEntity(enteringEntity)
//     let list2GUID = f.queryGuidByEntity(selfEntity)

//     let enterType = enteringEntity.get("棋子类型").asType("str")
//     let selfType = self.get("棋子类型").asType("str")
//     let enterTriCount = enteringEntity.get("triggerCount").asType("float")
//     let selfTriCount = self.get("triggerCount").asType("float")
//     let enterisStart = enteringEntity.get("isStart").asType("bool")
//     let selfisStart = self.get("isStart").asType("bool")

//     enteringEntity.set("triggerCount",1)
//     self.set("triggerCount",1)

//     gstsServerAddMoveEntity(enteringEntity)
//     gstsServerAddMoveEntity(self)

//     //碰撞时互相检测到对方的方法处理 添加到对方的当前碰撞列表当中
//     let isCanTrigger = 1

//     if(list1.includes(list2GUID)) isCanTrigger = 0
//     if(list2.includes(list1GUID)) isCanTrigger = 0
//     //console.log(isCanTrigger)
//     if(isCanTrigger == 1){
//       list1.push(list2GUID)
//       list2.push(list1GUID)
//       f.setCustomVariable(enteringEntity,"triggerGuidList",list1)
//       f.setCustomVariable(selfEntity,"triggerGuidList",list2)
//       if((enterType =="炮"&& enterTriCount == 0 && enterisStart ) || (selfType =="炮"&& selfTriCount == 0 && selfisStart))
//       {//
//       }
//       else
//       {
//        gstsServerCaliImpulse(enteringEntity,selfEntity)
//       }
//     }else
//     {
//       //console.log("重复碰撞屏蔽")
//     }
// })

//离开碰撞时清空各自的列表
// g.server({
//   id: 1073741827,
//   name:'trigger'
// }).on('whenExitingCollisionTrigger', (_evt, f) => {
//   self.set<"guid_list">("triggerGuidList",[guid(0)])
// })

//(弃用)
g.server({
  id: 1073741827,
}).onSignal('MoveForward', (_evt, f) => {
    let selfEntity = f.getSelfEntity()
    let charct = gsts.f.getAllCharacterEntitiesOfSpecifiedPlayer(
    f.getListOfPlayerEntitiesOnTheField()[0]
  )[0] as entity

    let charctPos = f.getEntityLocationAndRotation(charct).location
    let selfPos = f.getEntityLocationAndRotation(selfEntity).location

    let moveVec = f._3dVectorSubtraction(selfPos,charctPos)
    let relVec = f.create3dVector(moveVec.x,0,moveVec.z)

    relVec = f._3dVectorNormalization(relVec)
    f.setCustomVariable(selfEntity,"moveVec",relVec)


    f.stopAndDeleteBasicMotionDevice(selfEntity,"forwardMove",true)
    f.addUniformBasicLinearMotionDevice(selfEntity,"forwardMove",99,f._3dVectorZoom(relVec,5))

})


g.server({
  id: 1073741833,
  name:"moveActChange"
}).on("whenTimerIsTriggered",(_evt, f) => {
  if(_evt.timerName == Global.Tick_MoveActive) gstsServerMoveChangeTick(Global.deltaMove)
  else if(_evt.timerName == Global.Tick_OutCheck) gstsServerOutCheck(self)
  else if(_evt.timerName == Global.Tick_MoveActiveTriggerBefore ) gstsServerMoveChangeTick(Global.deltaMoveTriggerBefore)
})




    