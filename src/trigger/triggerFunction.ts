import * as Global from '../Global'
import { entity, vec3 } from 'genshin-ts/runtime/value'


/**
 * 速度插值结算定时器
 */
export function gstsServerMoveChangeTick(damping:number){
    let oldSpeed = self.get("moveVec").asType("vec3")
    //如果速度小于0.1则停止运动
    if(Vector3.Magnitude(oldSpeed) <= 0.1)
    {
      self.stopAndDeleteBasicMotionDevice("",true)
      self.set("triggerCount",0)
      self.set("isStart",false)
      self.set("moveVec",[0,0,0])
      let list = self.get("triggerGuidList").asType("entity_list")
      gsts.f.clearList(list)
            self.set<"entity_list">("triggerGuidList",list)
      self.clearSpecialEffectsBasedOnSpecialEffectAssets(configId(1199570948))

      self.stopTimer(Global.Tick_MoveActive)
      self.stopTimer(Global.Tick_MoveActiveTriggerBefore)
      self.stopTimer(Global.Tick_OutCheck)
      //gsts.f.setScanComponentSActiveScanTagId(self,1)
      //从列表里移除
      //gstsServerRemoveMoveEntity(self)
    }else
    {
      let newSpeed = LerpSpeed(oldSpeed,damping)
      gsts.f.setCustomVariable(self,"moveVec",newSpeed)
      self.addUniformBasicLinearMotionDevice("forwardMove",99,newSpeed)
    }
}

  //匀速插值变化
function LerpSpeed(oldSpeed:vec3,damping:number):vec3{
  //
  //damping = Global.deltaMove
  let newSpeed = Vector3.Scale(oldSpeed,(1-Global.deltaT*damping))
  return newSpeed
}

/**
 * 棋子出界判断
 */
export function gstsServerOutCheck(checkentity:entity)
{
    if((checkentity.pos.z < Global.Wall.leftz)||
    (checkentity.pos.z > Global.Wall.rightz)||
    (checkentity.pos.x < Global.Wall.topx)||
    (checkentity.pos.x > Global.Wall.floorx))
    {
        let qiziType = checkentity.get("棋子类型").asType("str")
        let chessFaction = gsts.f.queryEntityFaction(checkentity)
        //获取拥有者实体
        let ownerEntity = checkentity.owner()
        //删除所有运动器
        gsts.f.stopAndDeleteBasicMotionDevice(checkentity,"",true)
        gsts.f.stopTimer(checkentity,Global.Tick_OutCheck)

        if(checkentity.pos.z < Global.Wall.leftz)
        {        //左侧掉落
          const newvec = gsts.f._3dVectorRotation(gsts.f.create3dVector(0,0,checkentity.rotation.y*(-1)),gsts.f._3dVectorRotation(gsts.f.create3dVector(-90,0,0),Vector3.forward))
          gsts.f.addTargetOrientedRotationBasedMotionDevice(checkentity,"as",1,gsts.f.directionVectorToRotation(newvec,Vector3.back))
        }

        if(checkentity.pos.z > Global.Wall.rightz)
        {        //右侧掉落
            const newvec = gsts.f._3dVectorRotation(gsts.f.create3dVector(0,0,checkentity.rotation.y),gsts.f._3dVectorRotation(gsts.f.create3dVector(90,0,0),Vector3.forward))
            gsts.f.addTargetOrientedRotationBasedMotionDevice(self,"as",1,gsts.f.directionVectorToRotation(newvec,Vector3.forward))
        }

        if(checkentity.pos.x < Global.Wall.topx)
        {
          //上侧掉落
            const newvec = gsts.f._3dVectorRotation(gsts.f.create3dVector(checkentity.rotation.y*(-1),0,0),Vector3.forward)
            gsts.f.addTargetOrientedRotationBasedMotionDevice(self,"as",1,gsts.f.directionVectorToRotation(newvec,Vector3.left))

        }

        if(checkentity.pos.x > Global.Wall.floorx)
        {
          //下侧掉落
          const newvec = gsts.f._3dVectorRotation(gsts.f.create3dVector(checkentity.rotation.y,0,0),Vector3.forward)
          gsts.f.addTargetOrientedRotationBasedMotionDevice(self,"as",1,gsts.f.directionVectorToRotation(newvec,Vector3.right))
        }

        setTimeout((e)=>{
          //下落效果
          gsts.f.addUniformBasicLinearMotionDevice(checkentity,"draw",2,Vector3.Scale(Vector3.down,3))
          checkentity.playTimedEffects(configId(1199570947),"GI_RootNode",true,true,[0,0,0],[0,0,0],1,true)
        },1000)
        setTimeout((e)=>{
          //销毁棋子
          //checkentity.activateDisableModelDisplay(false)
          checkentity.destroy()
        },3000)
        
        

    }
}
