#!/usr/bin/env node
// 对手离场结算提示回归：锁定 #2 的幂等、回到准备清 guard、模拟退出复用官方行为，
// 并静态保护结算按钮与将帅死亡 rematch 不被改成即时 settleStage。
import { readFileSync } from 'node:fs'

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

const files = {
  chessInit: stripComments(readFileSync('src/nodes/stage/ChessInit.ts', 'utf8')),
  stagePanelGraph: stripComments(readFileSync('src/nodes/ui/StagePanelGraph.ts', 'utf8')),
  stagePanelUi: stripComments(readFileSync('src/systems/ui/stagePanelUi.ts', 'utf8')),
  matchLifecycle: stripComments(readFileSync('src/systems/stage/matchLifecycle.ts', 'utf8')),
  chessDestroy: stripComments(readFileSync('src/systems/stage/chessDestroy.ts', 'utf8')),
  variables: stripComments(readFileSync('src/contracts/variables.ts', 'utf8'))
}

const failures = []
function assert(cond, msg) {
  if (!cond) failures.push(msg)
}

assert(
  /opponentExitPromptHandled/.test(files.variables),
  'StageVar 应声明 opponentExitPromptHandled guard'
)
assert(
  /btn_simulateExit[\s\S]*gstsServerPromptOpponentExitSettlement\(\)/.test(files.stagePanelGraph),
  '模拟退出按钮应调用官方对手离场结算提示入口'
)
assert(
  !/gstsServerSimulateOpponentExit/.test(files.stagePanelGraph + files.stagePanelUi),
  '不应保留独立的模拟退出实现入口'
)
assert(
  /getListOfPlayerEntitiesOnTheField\(\)/.test(files.stagePanelUi) &&
    /gstsServerApplyOpponentExitSettlementPrompt/.test(files.stagePanelUi),
  '官方入口应遍历当前在场玩家并复用单玩家提示初始化 helper'
)
assert(
  /_evt\.timerName\s*==\s*Tick_PlayerExit[\s\S]*gstsServerCheckPlayerExitQuorum\(\)/.test(
    files.chessInit
  ),
  'PlayerExit 轮询 tick 应接入失去法定人数检查'
)
assert(
  /gstsServerHasLostLegalPlayerCount/.test(files.matchLifecycle) &&
    /MatchPhase\.PLAYING/.test(files.matchLifecycle) &&
    /queryGameModeAndPlayerNumber\(\)\.playerCount/.test(files.matchLifecycle) &&
    /int\(players\.length\)\s*<\s*quorum/.test(files.matchLifecycle),
  '失去法定人数判断应仅在进行中对局按理论游玩人数比较在场人数'
)
assert(
  /gstsServerCheckPlayerExitQuorum[\s\S]*gstsServerHasLostLegalPlayerCount\(\)[\s\S]*gstsServerPromptOpponentExitSettlement\(\)/.test(
    files.matchLifecycle
  ),
  'PlayerExit 人数不足路径应复用官方对手离场结算提示行为'
)
assert(
  /opponentExitPromptHandled\)\.asType\('bool'\)\s*==\s*false/.test(files.stagePanelUi) &&
    /stage\.set\(StageVar\.opponentExitPromptHandled,\s*true\)/.test(files.stagePanelUi),
  '官方入口应以关卡 guard 保证同一次提示幂等'
)
assert(
  /gstsServerResetToLobby[\s\S]*stage\.set\(StageVar\.opponentExitPromptHandled,\s*false\)/.test(
    files.matchLifecycle
  ),
  '回到准备时应清除对手离场提示 guard'
)
assert(
  /btn_settle[\s\S]*settleStage\(\)[\s\S]*send\(Signal\.ExitGame\)/.test(files.stagePanelGraph),
  '结算按钮应保持 Settle_Stage + ExitGame 行为'
)
assert(!/settleStage\(\)/.test(files.chessDestroy), '将帅死亡/rematch 链路不应立即 settleStage')
assert(
  !/获取玩家逃跑合法性|设置玩家逃跑合法性|getPlayerEscape|setPlayerEscape/i.test(
    Object.values(files).join('\n')
  ),
  '对手离场检测/提示不应使用逃跑合法性 API'
)

const MatchPhase = { LOBBY: 1, PLAYING: 2 }

function applyOpponentExitPrompt(state) {
  if (state.handled) return
  for (const p of state.players) {
    p.promptInit += 1
    p.score += 5
    p.settleButton = true
  }
  state.handled = true
}

function resetToLobby(state) {
  state.handled = false
}

function hasLostLegalPlayerCount(state) {
  return state.matchPhase === MatchPhase.PLAYING && state.players.length < state.playerCount
}

function pollPlayerExit(state) {
  if (hasLostLegalPlayerCount(state)) applyOpponentExitPrompt(state)
}

{
  const state = {
    handled: false,
    players: [{ id: 1, score: 0, promptInit: 0, settleButton: false }]
  }
  applyOpponentExitPrompt(state)
  assert(state.players[0].score === 5, '首次提示应给予既有 +5 离场奖励')
  assert(state.players[0].promptInit === 1, '首次提示应初始化一次结算提示 UI')
  assert(state.players[0].settleButton === true, '首次提示应显示结算按钮')
  applyOpponentExitPrompt(state)
  assert(state.players[0].score === 5, '重复触发不应重复加分')
  assert(state.players[0].promptInit === 1, '重复触发不应重复初始化 UI')
  resetToLobby(state)
  applyOpponentExitPrompt(state)
  assert(state.players[0].score === 10, '回到准备清 guard 后下一局可重新触发奖励')
  assert(state.players[0].promptInit === 2, '回到准备清 guard 后下一局可重新初始化 UI')
}

{
  const state = {
    handled: false,
    players: [
      { id: 1, score: 0, promptInit: 0, settleButton: false },
      { id: 2, score: 7, promptInit: 0, settleButton: false }
    ]
  }
  applyOpponentExitPrompt(state)
  assert(
    state.players.every((p) => p.promptInit === 1 && p.settleButton === true),
    '官方提示行为应覆盖当前仍在场玩家'
  )
  assert(
    state.players[0].score === 5 && state.players[1].score === 12,
    '每个在场玩家获得一次离场奖励'
  )
}

{
  const state = {
    matchPhase: MatchPhase.PLAYING,
    playerCount: 2,
    handled: false,
    players: [{ id: 1, score: 0, promptInit: 0, settleButton: false }]
  }
  pollPlayerExit(state)
  assert(state.players[0].score === 5, '双人对局开局后一人离场应给予仍在场玩家离场奖励')
  assert(state.players[0].promptInit === 1, '双人对局开局后一人离场应显示一次结算提示')
  assert(state.players[0].settleButton === true, '双人对局开局后一人离场应显示结算按钮')
  pollPlayerExit(state)
  assert(state.players[0].score === 5, '重复 PlayerExit tick 不应重复加分')
  assert(state.players[0].promptInit === 1, '重复 PlayerExit tick 不应重复触发结算提示')
}

{
  const state = {
    matchPhase: MatchPhase.PLAYING,
    playerCount: 1,
    handled: false,
    players: [{ id: 1, score: 0, promptInit: 0, settleButton: false }]
  }
  pollPlayerExit(state)
  assert(state.players[0].promptInit === 0, '单人试玩理论人数为 1 时不应触发对手离场提示')
}

{
  const state = {
    matchPhase: MatchPhase.LOBBY,
    playerCount: 2,
    handled: false,
    players: [{ id: 1, score: 0, promptInit: 0, settleButton: false }]
  }
  pollPlayerExit(state)
  assert(state.players[0].promptInit === 0, '准备阶段人数不足不应触发对手离场提示')
}

{
  const state = {
    matchPhase: MatchPhase.PLAYING,
    playerCount: 2,
    handled: false,
    players: [
      { id: 1, score: 0, promptInit: 0, settleButton: false },
      { id: 2, score: 0, promptInit: 0, settleButton: false }
    ]
  }
  pollPlayerExit(state)
  assert(
    state.players.every((p) => p.promptInit === 0 && p.score === 0 && p.settleButton === false),
    '进行中且人数仍合法时不应改变现有玩法'
  )
}

if (failures.length > 0) {
  console.error(`opponent-exit prompt regression FAILED (${failures.length}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('opponent-exit prompt regression passed (static invariants + 6 scenarios).')
