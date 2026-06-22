import { g } from 'genshin-ts/runtime/core'

import { MatchPhase, TurnPhase } from '../../contracts/stage'
import { Tick_CheckChessMove, Tick_PlayerExit } from '../../contracts/timers'
import { StageVar } from '../../contracts/variables'
import { gstsServerCheckPlayerExitQuorum } from '../../systems/stage/matchLifecycle'
import { gstsServerCheckPieceMovementState } from '../../systems/turn/turnState'
import { gstsServerSyncOpponentNicknamesOnBothJoined } from '../../systems/ui/opponentInfoUi'

g.server({
  id: 1073741842,
  name: 'ChessInitGraph'
}).on('whenEntityIsCreated', (_evt, f) => {
  f.startTimer(self, Tick_CheckChessMove, true, [3])
  let moveList = self.get(StageVar.moveList).asType('entity_list')
  gsts.f.clearList(moveList)
  self.set(StageVar.moveList, moveList)
  //两轴生命周期初值（取代 canChange=true/turnInitialized=false）：关卡创建即置 LOBBY/ACTIVE，
  //保 startMatchIfReady 首读幂等闸 matchPhase 有值（自定义变量 set 即创建，注入后需重进关卡生效）。
  self.set(StageVar.matchPhase, MatchPhase.LOBBY)
  self.set(StageVar.turnPhase, TurnPhase.ACTIVE)
  //本局是否曾满员(2人)——满员单触发同步对方昵称用（见 gstsServerSyncOpponentNicknamesOnBothJoined）
  self.set(StageVar.bothJoined, false)
  self.set(StageVar.opponentExitPromptHandled, false)
  self.set(StageVar.injectVerify, '2026-06-21-lifecycle-1')
})

g.server({
  id: 1073741842
}).on('whenTimerIsTriggered', (_evt, _f) => {
  if (_evt.timerName == Tick_CheckChessMove) {
    //满员首次时互写对方昵称（原 settlement.gstsServerRefreshBothJoined 的昵称职责）
    gstsServerSyncOpponentNicknamesOnBothJoined()
    //ADR-0003 决策6：删去首回合 init 调用（开局改由 playerReady 事件驱动，去 #7 双触发）；本计时器只留昵称同步 + 棋子静止检测。
    gstsServerCheckPieceMovementState()
  } else if (_evt.timerName == Tick_PlayerExit) {
    gstsServerCheckPlayerExitQuorum()
  }
})

//实体移除/销毁时（关卡级事件，仅在关卡实体可触发）：真实玩家退出可比 Tick_PlayerExit 5s 轮询更快收敛到结算提示。
//事件只作唤醒信号、不当作玩家退出事实——故意不按 eventSourceGuid 识别被移除实体，直接复用与轮询同一个失去法定人数检查
//（gstsServerCheckPlayerExitQuorum）。最终决定仍由 matchPhase==PLAYING 且在场玩家数 < 理论人数给出：棋子销毁、rematch 清场、
//其他非玩家实体移除在人数仍合法时一律不触发提示；与轮询共用 opponentExitPromptHandled guard 保证幂等，重复事件不重复加分。
g.server({
  id: 1073741842
}).on('whenEntityIsRemovedDestroyed', (_evt, _f) => {
  gstsServerCheckPlayerExitQuorum()
})
