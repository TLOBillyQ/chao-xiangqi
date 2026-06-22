#!/usr/bin/env node
// 静态不变量回归（防回归到「散写式 gate」）。配合 repro-matchstart.mjs（行为正确性）双层防护。
//
// 历史教训：旧版本逐条 regex「某段代码是否存在」给假绿——代码在但不可达 / 被旁路也算过。
// 本版改为【收敛性 / 负向约束】：旧生命周期符号彻底消失 + isControl 投射唯一 + 开局触发唯一 + 守门到位。
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function collectTs(dir) {
  let out = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out = out.concat(collectTs(p))
    else if (ent.name.endsWith('.ts')) out.push(p)
  }
  return out
}

// 去注释（块 /* */ 与行 //），避免注释里提及的历史符号触发误报；key 统一为正斜杠相对路径
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}
const code = Object.fromEntries(
  collectTs('src').map((f) => [f.replace(/\\/g, '/'), stripComments(readFileSync(f, 'utf8'))])
)

const checks = []

// 1) 旧生命周期符号在【代码】中零残留（注释允许提及历史）
const deadSymbols = [
  'gameStage',
  'GameStage',
  'canChange',
  'turnInitialized',
  'REQUIRED_PLAYERS',
  'InitializeFirstTurnIfNeeded',
  'gstsServerReadyToPlay'
]
for (const sym of deadSymbols) {
  const hits = Object.entries(code)
    .filter(([, c]) => c.includes(sym))
    .map(([f]) => f)
  checks.push({ name: `旧符号 ${sym} 零代码残留`, ok: hits.length === 0, detail: hits.join(', ') })
}

// 2) isControl 投射收敛：set isControl 只允许出现在 applyTurn 所在文件 + 3 处登记豁免
const isControlAllow = new Set([
  'src/systems/stage/matchLifecycle.ts', // applyTurn：唯一投射点
  'src/nodes/player/playerCreate.ts', // 模板默认 false（LOBBY 入场）
  'src/systems/piece/launch.ts', // 发射即时锁
  'src/nodes/charge/StopCharge.ts' // 蓄力发射即时锁
])
const isControlWriters = Object.entries(code)
  .filter(([, c]) => /\.set\(\s*(?:PlayerVar\.isControl|'isControl')/.test(c))
  .map(([f]) => f)
const stray = isControlWriters.filter((f) => !isControlAllow.has(f))
checks.push({
  name: 'isControl 写入仅限 applyTurn + 3 登记豁免',
  ok: stray.length === 0,
  detail: `越界写入: ${stray.join(', ')}`
})
checks.push({
  name: 'matchLifecycle 仍是 isControl 投射点（未被掏空）',
  ok: isControlWriters.includes('src/systems/stage/matchLifecycle.ts'),
  detail: ''
})

// 3) 开局触发唯一：gstsServerStartMatchIfReady() 只被 ReadyToPlayGraph 调用（排除其定义文件 matchLifecycle）
const startCallers = Object.entries(code)
  .filter(
    ([f, c]) => c.includes('gstsServerStartMatchIfReady()') && !f.endsWith('matchLifecycle.ts')
  )
  .map(([f]) => f)
checks.push({
  name: 'startMatchIfReady 唯一调用点 = ReadyToPlayGraph',
  ok: startCallers.length === 1 && startCallers[0] === 'src/nodes/stage/ReadyToPlayGraph.ts',
  detail: `调用方: ${startCallers.join(', ')}`
})

// 4) 摆盘 helper 只被 matchLifecycle 调（不被其他图旁路），排除其定义文件 readyToPlay
for (const helper of [
  'gstsServerSetupReadyPlayers',
  'gstsServerClearBoard',
  'gstsServerPlacePieces'
]) {
  const callers = Object.entries(code)
    .filter(([f, c]) => new RegExp(`${helper}\\(`).test(c) && !f.endsWith('readyToPlay.ts'))
    .map(([f]) => f)
  const ok = callers.length === 1 && callers[0] === 'src/systems/stage/matchLifecycle.ts'
  checks.push({
    name: `${helper} 仅 matchLifecycle 调用`,
    ok,
    detail: `调用方: ${callers.join(', ')}`
  })
}

// 5) switchTurn 守门含两轴（matchPhase==PLAYING && turnPhase==ACTIVE）
const turnState = code['src/systems/turn/turnState.ts'] || ''
checks.push({
  name: 'switchTurn 守门含 MatchPhase.PLAYING 与 TurnPhase.ACTIVE',
  ok: /MatchPhase\.PLAYING/.test(turnState) && /TurnPhase\.ACTIVE/.test(turnState),
  detail: ''
})

// 6) ChessInit 设两轴初值（不再 canChange/turnInitialized）
const chessInit = code['src/nodes/stage/ChessInit.ts'] || ''
checks.push({
  name: 'ChessInit 初始化 matchPhase 与 turnPhase',
  ok: /matchPhase/.test(chessInit) && /turnPhase/.test(chessInit),
  detail: ''
})

// 7) 首发缺红回退黑的算法仍在（修单人黑方 bug 的核心）
const matchLifecycle = code['src/systems/stage/matchLifecycle.ts'] || ''
checks.push({
  name: 'startMatchIfReady 保留红/黑首发选择（缺红回退黑）',
  ok: /hasRedPlayer/.test(matchLifecycle) && /hasBlackPlayer/.test(matchLifecycle),
  detail: ''
})

// 8) applyTurn 判当前方必须用阵营，禁 entity 身份比较：curPlayer 经 set/get 往返与 fresh query 的 players[i] 句柄不==（局内实测：回合切到红方后红方拿不到控制权、干等倒计时归零又切回）
checks.push({
  name: 'applyTurn 用阵营判当前方，禁 entity== 身份比较',
  ok: !/\]\s*==\s*cur\b/.test(matchLifecycle) && /queryEntityFaction/.test(matchLifecycle),
  detail:
    'matchLifecycle 出现 players[i]==cur 式 entity 身份比较（应改 queryEntityFaction 阵营判定）'
})

const failed = checks.filter((c) => !c.ok)
if (failed.length > 0) {
  console.error('turn-state regression（静态不变量）FAILED:')
  for (const c of failed) console.error(`  ✗ ${c.name}${c.detail ? ' — ' + c.detail : ''}`)
  process.exit(1)
}
console.log(`turn-state regression passed (${checks.length} invariants).`)
