import { g } from 'genshin-ts/runtime/core'

import { Signal } from '../../resources/signals'
import { gstsServerStartMatchIfReady } from '../../systems/stage/matchLifecycle'

/**
 * 历史图 `_GSTS_readyToPlay`(1073741849) 同 ID 接管。挂【关卡实体】——监听 playerReady 全局信号。
 * 见 docs/adr/0002-historical-graph-same-id-takeover.md、docs/adr/0003-unified-match-lifecycle-gate.md。
 *
 * playerReady 由 StagePanel(1847) 点「准备/再来一局」时 send。本入口是【唯一开局触发点】（ADR-0003 决策6 事件驱动）：
 * 调 matchLifecycle.gstsServerStartMatchIfReady——校验可开局（全员已准备 + 在场人数达理论入局数）后，
 * 原子跑「摆盘 + 置 PLAYING + 授首回合 + 起倒计时」；幂等闸 matchPhase==LOBBY。
 */
g.server({ id: 1073741849, name: 'ReadyToPlay' }).onSignal(Signal.playerReady, (_evt, _f) => {
  gstsServerStartMatchIfReady()
})
