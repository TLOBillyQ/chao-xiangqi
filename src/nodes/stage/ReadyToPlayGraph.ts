import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerReadyToPlay } from '../../systems/stage/readyToPlay'

/**
 * 历史图 `_GSTS_readyToPlay`(1073741849) 同 ID 接管。挂【关卡实体】——监听 playerReady 全局信号。
 * 见 docs/adr/0002-historical-graph-same-id-takeover.md、recovered/orphan-nodegraphs/TAKEOVER_CHECKLIST.md ③。
 *
 * playerReady 由 StagePanel(1847) 点「准备/再来一局」时 send；双方都已准备(玩家状态==1)才真正开局摆盘。
 * 关卡状态走 helper 内 getServerStageEntity()；首回合复用 turnState（已加同款「已准备」闸，杜绝双初始化）。
 */
g.server({ id: 1073741849, name: 'ReadyToPlay' }).onSignal(Signal.playerReady, (_evt, _f) => {
  gstsServerReadyToPlay()
})
