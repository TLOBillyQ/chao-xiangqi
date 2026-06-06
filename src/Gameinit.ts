import { g } from 'genshin-ts/runtime/core'
import * as Global from './Global'
import {gstsServerCheckChessMovestage} from './ChangeControl'

g.server({
  id: 1073741842,
  name:'棋子坐标初始化'
}).on('whenEntityIsCreated', (_evt, f) => {

    f.startTimer(self,"CheckChessMovestage",true,[3])
    self.set("canChange",true)
    self.set("gstsInjectVerify","2026-06-03-verify-1")
    for(let i=0;i<Global.initPos.红方坐标.length; i++)
    {
        // let createPos = Vector3.Add(Global.firstChessPos,Vector3.Scale(Global.initPos.红方坐标[i],Global.chessInterval))
        // f.createPrefab(1077936129n,createPos,[0,0,0],Global.getServerStageEntity(),true,1,[Global.EntityTag.QiZi])

        // let blackPos =  Vector3.Add(Global.firstChessPos,Vector3.Scale(Global.initPos.黑方坐标[i],Global.chessInterval))
        // f.createPrefab(1077936130n,blackPos,[0,180,0],Global.getServerStageEntity(),true,1,[Global.EntityTag.QiZi])
    }
})

g.server({
  id: 1073741842,
}).on('whenTimerIsTriggered', (_evt, f) => {
  gstsServerCheckChessMovestage()
})
