import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerStartGame } from '../../systems/stage/startGame'

//历史图 _GSTS_readyToPlay（id 1073741849，见 contracts/graphIds.ts readyToPlay）的同 ID 接管入口。
//准备链路：StagePanel 发 Signal.playerReady → 本图判定全员已准备后开局（gstsServerStartGame）。
g.server({
  id: 1073741849,
  name: 'readyToPlay'
}).onSignal(Signal.playerReady, (_evt, _f) => {
  gstsServerStartGame()
})
