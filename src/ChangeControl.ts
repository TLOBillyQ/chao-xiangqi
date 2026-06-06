import { entity } from 'genshin-ts/runtime/value'
import * as Global from './Global'
import {gstsServerErrorMsg as ErrorMsg} from './Tool'
import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'


/**
 * 实时检测棋子状态
 */
export function gstsServerCheckChessMovestage()
{
    let moveList = self.get("moveList").asType("entity_list")
    for(let i=0;i<moveList.length;i++)
    {
        if (Vector3.Magnitude(moveList[i].get("moveVec").asType("vec3"))<0.1)
        {
            gsts.f.removeValueFromList(moveList,i)
            self.set("moveList",moveList)
            if(moveList.length <= 0) gstsServerChangeControl()
            //if(moveList.length <= 0) gstsServerChangeControl_Test()
            break
        }
    }
}


/**
 * 往移动列表里添加删除停止的实体
 * 列表长度为0时则切换控制权
 * @param moveEntity 
 */
export function gstsServerRemoveMoveEntity(moveEntity:entity)
{
    let stage = Global.getServerStageEntity()
    let moveList = stage.get("moveList").asType("entity_list")
    for(let i=0;i<moveList.length;i++)
    {
        if (moveEntity == moveList[i]) 
        {
            gsts.f.removeValueFromList(moveList,i)
            break
        }
    }
    stage.set("moveList",moveList)
    if(moveList.length <= 0) gstsServerChangeControl_Test()
}

/**
 * 往移动列表里添加移动中的实体
 * @param moveEntity 
 */
export function gstsServerAddMoveEntity(moveEntity:entity)
{
    let stage = Global.getServerStageEntity()
    
    let moveList = stage.get("moveList").asType("entity_list")
    if(!moveList.includes(moveEntity)) {
        moveList.push(moveEntity)
    }
    stage.set("moveList",moveList)
    
}

export function gstsServerCanControl():number
{
    let isCan = 1
    let stage = Global.getServerStageEntity()
    let moveList = stage.get("moveList").asType("entity_list")

    if (moveList.length > 0)
    {
        isCan = 0
    }

    return isCan
}

export function gstsServerChangeControl()
{
    let StageEntity = Global.getServerStageEntity()
    let playerEntity =StageEntity.get("curPlayer").asType("entity")
    let Faction = gsts.f.queryEntityFaction(playerEntity)
    let canChange = StageEntity.get("canChange").asType("bool")

    if (Faction == Global.factionRed){
        if(canChange)
        {
            ErrorMsg("<color=#000000>黑方回合</color>",player(1) as entity,false)
            ErrorMsg("<color=#000000>黑方回合</color>",player(2) as entity,true)
            playerEntity.setUiControlStatus(Global.timersId.red,UIControlGroupStatus.Off)
            //启动黑方倒计时
            //gsts.f.stopTimer(StageEntity,"红方倒计时")
            //切换保护 避免短时间内频繁切换导致错误
            StageEntity.set("canChange",false)
            playerEntity.set("isControl",false)
            gsts.f.modifyGlobalTimer(StageEntity,"红方倒计时",-999)
            setTimeout((e)=>{
                StageEntity.set("canChange",true)
                player(2).set("isControl",true)
                player(2).setUiControlStatus(Global.timersId.black,UIControlGroupStatus.On)
                StageEntity.set("curPlayer",player(2))
                gsts.f.startGlobalTimer(StageEntity,"黑方倒计时")
            },2000)
        }
    }
    else {
        if(canChange)
        {
            ErrorMsg("<color=#FF0000>红方回合</color>",player(1) as entity,true)
            ErrorMsg("<color=#FF0000>红方回合</color>",player(2) as entity,false)
            
            playerEntity.setUiControlStatus(Global.timersId.black,UIControlGroupStatus.Off)
            //启动红方倒计时
            //gsts.f.stopTimer(StageEntity,"黑方倒计时")
            StageEntity.set("canChange",false)
            playerEntity.set("isControl",false)
            gsts.f.modifyGlobalTimer(StageEntity,"黑方倒计时",-999)
            //切换保护 避免短时间内频繁切换导致错误

            setTimeout((e)=>{
                StageEntity.set("canChange",true)
                player(1).set("isControl",true)
                player(1).setUiControlStatus(Global.timersId.red,UIControlGroupStatus.On)
                StageEntity.set("curPlayer",player(1))
                gsts.f.startGlobalTimer(StageEntity,"红方倒计时")
            },2000)
        }
    }


}

export function gstsServerChangeControl_Test()
{
    //console.log("切换")
    let StageEntity = Global.getServerStageEntity()
    let playerEntity =StageEntity.get("curPlayer").asType("entity")
    let Faction = gsts.f.queryEntityFaction(playerEntity)
    let canChange = StageEntity.get("canChange").asType("bool")
    if (Faction == Global.factionRed){
        if(canChange)
        {
            ErrorMsg("<color=#000000>切换到黑方阵营</color>",playerEntity,false)
            gsts.f.modifyEntityFaction(playerEntity, 4)
            playerEntity.setUiControlStatus(Global.timersId.red,UIControlGroupStatus.Off)
            
            //启动黑方倒计时
            //gsts.f.stopTimer(StageEntity,"红方倒计时")
            gsts.f.modifyGlobalTimer(StageEntity,"红方倒计时",-999)
            //切换保护 避免短时间内频繁切换导致错误
            StageEntity.set("canChange",false)
            playerEntity.set("isControl",false)
            setTimeout((e)=>{
                StageEntity.set("canChange",true)
                playerEntity.set("isControl",true)
                playerEntity.setUiControlStatus(Global.timersId.black,UIControlGroupStatus.On)
                gsts.f.startGlobalTimer(StageEntity,"黑方倒计时")
            },3000)
        }


    }
    else {
        if(canChange)
        {
            ErrorMsg("<color=#FF0000>切换到红方阵营</color>",playerEntity,true)
            gsts.f.modifyEntityFaction(playerEntity, 1)
            playerEntity.setUiControlStatus(Global.timersId.black,UIControlGroupStatus.Off)
            //启动红方倒计时
            //gsts.f.stopTimer(StageEntity,"黑方倒计时")
            gsts.f.modifyGlobalTimer(StageEntity,"黑方倒计时",-999)
            //切换保护 避免短时间内频繁切换导致错误
            StageEntity.set("canChange",false)
            playerEntity.set("isControl",false)
            setTimeout((e)=>{
                StageEntity.set("canChange",true)
                playerEntity.set("isControl",true)
                playerEntity.setUiControlStatus(Global.timersId.red,UIControlGroupStatus.On)
                gsts.f.startGlobalTimer(StageEntity,"红方倒计时")
            },3000)
        }
    }
}



