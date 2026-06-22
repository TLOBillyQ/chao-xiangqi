#!/usr/bin/env node
// 行为正确性回归（spec lock）——纯 JS 镜像 src/systems/stage/matchLifecycle.ts 的
// canStartMatch / 内联首发选择 / applyTurn，以及 src/systems/turn/turnState.ts 的 switchTurn 目标选择。
//
// 为什么是镜像而非真跑：.mjs 跑不了 gsts 节点图。本文件把算法语义钉死成可断言的规格——
// 任何对上述函数语义的改动（首发优先级、quorum 比较、HANDOFF/LOBBY 锁控、切换目标）都必须同步本文件，
// 否则断言变红。配合 check-turn-state-regression.mjs（静态不变量：无旧键 / isControl 投射收敛）双层防护。
//
// 历史现场：04a8ddc 把开局闸写成「在场人数 >= REQUIRED_PLAYERS(2)」，单人试玩（黑方）永远拿不到控制权 → 无法选子。
// ADR-0003 改 quorum = queryGameModeAndPlayerNumber().playerCount，单人试玩 playerCount=1 即可开局（见 S1/S5）。

const MatchPhase = { LOBBY: 1, PLAYING: 2 }
const TurnPhase = { ACTIVE: 1, HANDOFF: 2 }

// 镜像 matchLifecycle.gstsServerCanStartMatch：全员已准备(playerStage==1) 且 在场人数 >= 理论入局人数
function canStartMatch(players, playerCount) {
  let allReady = true
  for (const p of players) {
    if (p.playerStage !== 1) allReady = false
  }
  return allReady && players.length >= playerCount
}

// 镜像 matchLifecycle.gstsServerStartMatchIfReady 内联首发：红先手，缺红回退黑
function pickFirstTurn(players) {
  let redPlayer = null
  let blackPlayer = null
  for (const p of players) {
    if (p.faction === 'red') redPlayer = p
    else if (p.faction === 'black') blackPlayer = p
  }
  if (redPlayer) return { ok: true, target: redPlayer }
  if (blackPlayer) return { ok: true, target: blackPlayer }
  return { ok: false, target: null }
}

// 镜像 matchLifecycle.gstsServerApplyTurn：据 (matchPhase,turnPhase,curPlayer) 投射每个玩家 isControl + 倒计时
function applyTurn(matchPhase, turnPhase, curPlayer, players) {
  const active = matchPhase === MatchPhase.PLAYING && turnPhase === TurnPhase.ACTIVE
  const curIsRed = active && curPlayer != null && curPlayer.faction === 'red'
  // 当前方判定用【阵营】，镜像 matchLifecycle 修复：实现里 curPlayer 经 gsts set/get 往返后与 fresh query 的
  // players[i] 句柄不 ==，故绝不能用 entity 身份比较；一方一阵营，同阵营即当前方。（纯 JS 复现不出句柄差异，
  // 此处用阵营是为锁定正确判定方式；真正防 entity== 回归的是 check-turn-state-regression.mjs 的静态不变量。）
  const controls = players.map((p) => {
    let isCur = false
    if (active) {
      if (curIsRed) isCur = p.faction === 'red'
      else isCur = p.faction === 'black'
    }
    return { id: p.id, isControl: isCur }
  })
  let countdown = 'none'
  if (active && curIsRed) countdown = 'red'
  else if (active) countdown = 'black'
  return { controls, countdown }
}

// 镜像 turnState.gstsServerSwitchTurn 目标选择：当前方 → 对手，缺对手则留本方
function pickSwitchTarget(curFaction, players) {
  let redPlayer = null
  let blackPlayer = null
  for (const p of players) {
    if (p.faction === 'red') redPlayer = p
    else if (p.faction === 'black') blackPlayer = p
  }
  if (curFaction === 'red') {
    if (blackPlayer) return { ok: true, target: blackPlayer, targetIsRed: false }
    if (redPlayer) return { ok: true, target: redPlayer, targetIsRed: true }
  } else {
    if (redPlayer) return { ok: true, target: redPlayer, targetIsRed: true }
    if (blackPlayer) return { ok: true, target: blackPlayer, targetIsRed: false }
  }
  return { ok: false, target: null, targetIsRed: false }
}

// ---------- 断言框架 ----------
const failures = []
function assert(cond, msg) {
  if (!cond) failures.push(msg)
}
function ctrlOf(res, id) {
  const c = res.controls.find((x) => x.id === id)
  return c ? c.isControl : undefined
}

const red1 = { id: 1, faction: 'red', playerStage: 1 }
const black2 = { id: 2, faction: 'black', playerStage: 1 }
const black2NotReady = { id: 2, faction: 'black', playerStage: 3 }

// S1 单人黑方试玩（playerCount=1）——原 bug 现场：黑方必须能开局并取得控制权（可选子）
{
  const players = [{ ...black2 }]
  assert(canStartMatch(players, 1) === true, 'S1 单人黑方 playerCount=1 应可开局')
  const first = pickFirstTurn(players)
  assert(first.ok && first.target.id === 2, 'S1 缺红应回退黑作首发')
  const res = applyTurn(MatchPhase.PLAYING, TurnPhase.ACTIVE, first.target, players)
  assert(ctrlOf(res, 2) === true, 'S1 黑方应取得控制权（可选子）')
  assert(res.countdown === 'black', 'S1 应起黑方倒计时')
}

// S2 单人红方试玩（playerCount=1）
{
  const players = [{ ...red1 }]
  assert(canStartMatch(players, 1) === true, 'S2 单人红方 playerCount=1 应可开局')
  const first = pickFirstTurn(players)
  assert(first.ok && first.target.id === 1, 'S2 红先手')
  const res = applyTurn(MatchPhase.PLAYING, TurnPhase.ACTIVE, first.target, players)
  assert(ctrlOf(res, 1) === true, 'S2 红方应取得控制权')
  assert(res.countdown === 'red', 'S2 应起红方倒计时')
}

// S3 双人，仅一方已准备（playerCount=2）——不可开局
{
  const players = [{ ...red1 }, { ...black2NotReady }]
  assert(canStartMatch(players, 2) === false, 'S3 双人未全员准备不可开局')
}

// S4 双人全员准备（playerCount=2）——红先手，仅红控制
{
  const players = [{ ...red1 }, { ...black2 }]
  assert(canStartMatch(players, 2) === true, 'S4 双人全员准备可开局')
  const first = pickFirstTurn(players)
  assert(first.ok && first.target.id === 1, 'S4 红先手')
  const res = applyTurn(MatchPhase.PLAYING, TurnPhase.ACTIVE, first.target, players)
  assert(ctrlOf(res, 1) === true && ctrlOf(res, 2) === false, 'S4 仅红方控制')
  assert(res.countdown === 'red', 'S4 红方倒计时')
}

// S5 单人在场但理论入局 2 人（房间/匹配 playerCount=2）——mode-aware quorum 应阻止独自开局
{
  const players = [{ ...black2 }]
  assert(
    canStartMatch(players, 2) === false,
    'S5 单人但 playerCount=2 不应开局（mode-aware quorum）'
  )
}

// S6 非 PLAYING-ACTIVE（LOBBY / HANDOFF）一律全锁控、无倒计时
{
  const players = [{ ...red1 }, { ...black2 }]
  const lobby = applyTurn(MatchPhase.LOBBY, TurnPhase.ACTIVE, red1, players)
  assert(ctrlOf(lobby, 1) === false && ctrlOf(lobby, 2) === false, 'S6 LOBBY 全锁控')
  assert(lobby.countdown === 'none', 'S6 LOBBY 无倒计时')
  const handoff = applyTurn(MatchPhase.PLAYING, TurnPhase.HANDOFF, red1, players)
  assert(ctrlOf(handoff, 1) === false && ctrlOf(handoff, 2) === false, 'S6 HANDOFF 全锁控')
  assert(handoff.countdown === 'none', 'S6 HANDOFF 无倒计时')
}

// S7 回合切换目标：红切黑、黑切红；单人缺对手留本方（不卡死）
{
  const players = [{ ...red1 }, { ...black2 }]
  assert(pickSwitchTarget('red', players).target.id === 2, 'S7 红方回合切到黑方')
  assert(pickSwitchTarget('black', players).target.id === 1, 'S7 黑方回合切到红方')
  const soloBlack = [{ ...black2 }]
  const t = pickSwitchTarget('black', soloBlack)
  assert(t.ok && t.target.id === 2 && t.targetIsRed === false, 'S7 单人黑方切换留本方')
}

if (failures.length > 0) {
  console.error(`matchstart repro FAILED (${failures.length}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('matchstart repro passed (7 scenarios).')
