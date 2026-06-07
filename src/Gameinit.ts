import { g } from 'genshin-ts/runtime/core'
import {gstsServerCheckChessMovestage} from './ChangeControl'

g.server({
  id: 1073741842,
  name:'棋子坐标初始化'
}).on('whenEntityIsCreated', (_evt, f) => {

    f.startTimer(self,"CheckChessMovestage",true,[3])
    self.set("canChange",true)
    self.set("gstsInjectVerify","2026-06-03-verify-1")
})

g.server({
  id: 1073741842,
}).on('whenTimerIsTriggered', (_evt, _f) => {
  gstsServerCheckChessMovestage()
})
