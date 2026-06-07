import { g } from 'genshin-ts/runtime/core'
import { entity, faction, float,ReadonlyDict, vec3 } from 'genshin-ts/runtime/value'
import { gsteServerpieceDirections_red,gsteServerpieceDirections_black ,gridNormalization,EntityTag,Wall,dirPrefabs, factionRed, factionBlack, trajectoryPrefabId, getServerStageEntity} from '../../Global'
//import { gstsServerSureToMove } from '../qizi/qizi_move'
import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import { gstsServerCanControl } from '../../ChangeControl'
import { gstsServerActiviteChangeUI, gstsServerActiviteDirUI } from '../../UIControl/ControlUIFunc'
import { gstsServerVec3ToVec2 } from '../../Tool'
import * as TrajectoryUtils from '../../chessEntity/TrajectoryUtils'
import { Signal } from '../../resources/signals'

g.server({
  id: 1073741829,
  name:"getNowQZ",
}).onSignal(Signal.GetQiZi, (_evt, f) => {
  //手动替换
  let targetEntity = self.get("ScanEntity").asType("entity")
  //let playerEnt = entityList[1]

  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if(entity == self)
  {
    if(gstsServerCanControl() == 1)
    {
      let enteringTag = f.getEntityUnitTagList(targetEntity)[0]
      //筛选到棋子
      if (enteringTag == EntityTag.QiZi)gstsServerCreateDirEffect(targetEntity,self)
      //方向标签
      //else if (enteringTag == EntityTag.Dir) gstsServerSureToMove(targetEntity)
    }
  }
})


//创建方向控件 参数1 目标棋子实体 参数2 玩家实体
function gstsServerCreateDirEffect(targetEntity:entity,controlEntity:PlayerEntity)
{
  //先把旧的扫描指示销毁
  gstsServerDestroyOldDirTag()
  //屏蔽当前选中棋子的扫描
  //gsts.f.setScanComponentSActiveScanTagId(targetEntity,2)
  
  let Faction = gsts.f.queryEntityFaction(targetEntity)
  let qiziKey = gsts.f.getCustomVariable(targetEntity,"棋子类型").asType("str")


  
  let pos = gsts.f.getEntityLocationAndRotation(targetEntity).location


  //先给一个默认值
  let dirList = list("vec3",[[0, 1, 0]])
  
  //不同阵营读取字典不同
  if(Faction == factionRed)
  {
    if (pos.x < Wall.center && qiziKey == "兵")
    {
      qiziKey = "兵过河"
    }
    dirList = gsteServerpieceDirections_red(qiziKey)
  }

  if(Faction == factionBlack)
  {
    if (pos.x > Wall.center && qiziKey == "兵")
    {
      qiziKey = "兵过河"
    }
    dirList = gsteServerpieceDirections_black(qiziKey)
  }


  for(let i = 0;i < dirList.length;i++) 
  {
      let rad = gsts.f.arctangentFunction(dirList[i].x/dirList[i].y);
      let Deg = gsts.f.radiansToDegrees(rad)
    
      let Normalization = gsts.f._3dVectorNormalization(dirList[i])
      if(dirList[i].y < 0) Deg += 180
      let createPos = gsts.f.create3dVector(pos.x-Normalization.y,pos.y,pos.z+Normalization.x)
      let rotate = gsts.f.create3dVector(0,Deg,0)

      let PrefabId = dirPrefabs.red
      if(Faction == factionBlack)
      {
        PrefabId = dirPrefabs.black
      }
      //新增玩家选中的棋子类型变量
      self.set("curChessType",qiziKey)
      self.set("curChooseChess",targetEntity)

      let e = gsts.f.createPrefab(PrefabId,pos,rotate,targetEntity,true,1,[EntityTag.Dir])
      gsts.f.setCustomVariable(e,"moveVec",Normalization)
      gsts.f.setCustomVariable<"float">(e,"dirUIIndex",global.float(i))
    }

    //controlEntity.setUiControlStatus(1073741846n,UIControlGroupStatus.On)
    //控件管理
    //激活控件方向选择
    gstsServerActiviteChangeUI(controlEntity)
    //激活方向
    gstsServerActiviteDirUI(controlEntity,qiziKey)
    gstsServerSpawnTrajectoryLine(targetEntity, dirList[0], qiziKey, Faction)
}


//销毁旧的棋子扫描
export function gstsServerDestroyOldDirTag()
{
  let tagPrefabListRed = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red);
  if(tagPrefabListRed.length > 0)
  {
    let motherEntity = gsts.f.getOwnerEntity(tagPrefabListRed[0])
    //gsts.f.setScanComponentSActiveScanTagId(motherEntity,1)
  }
  while(tagPrefabListRed.length > 0)
  {
    gsts.f.destroyEntity(tagPrefabListRed[tagPrefabListRed.length-1])
  }

  let tagPrefabListBlack = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black);
  if(tagPrefabListBlack.length > 0)
  {
    let motherEntity = gsts.f.getOwnerEntity(tagPrefabListBlack[0])
    //gsts.f.setScanComponentSActiveScanTagId(motherEntity,1)
  }
  while(tagPrefabListBlack.length > 0)
  {
    gsts.f.destroyEntity(tagPrefabListBlack[tagPrefabListBlack.length-1])
  }

  let trajList = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(trajectoryPrefabId)
  while(trajList.length > 0) {
    gsts.f.destroyEntity(trajList[trajList.length-1])
  }

}


export function gstsServerSpawnTrajectoryLine(chessEntity: entity, dirVec: vec3, chessType: string, faction: faction) {
  const worldDir = gstsServerVec3ToVec2(dirVec)
  const normalizedDir = gsts.f._3dVectorNormalization(worldDir)
  const origin = chessEntity.pos
  TrajectoryUtils.gstsServerSpawnTrajectoryForDir(origin, normalizedDir, chessType, faction, chessEntity)
}
