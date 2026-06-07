import { g } from 'genshin-ts/runtime/core'

g.server({
  id: 1073741828,
  name:'playerCreated'
}).on(
   'whenEntityIsCreated', (_evt, f) => {
    //let Faction = f.queryEntityFaction(entity)
    f.startTimer(self,"sendCurStageToOther",true,[3])
    //初始化镜头
    f.setPlayerCameraToFollowEntity(self,f.queryEntityByGuid(1077936985n),'准备镜头')
    f.activateDisableModelDisplay(self.character,false)
   }
)

g.server({
  id: 1073741828,
}).on('whenTimerIsTriggered', (_evt, _f) => {
  send("chgPlayerStage")
})
