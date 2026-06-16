#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const files = {
  turnState: 'src/systems/turn/turnState.ts',
  chessInit: 'src/nodes/stage/ChessInit.ts',
  playerCreate: 'src/nodes/player/playerCreate.ts',
  playerTimers: 'src/nodes/player/playerTimers.ts',
  cameraUi: 'src/systems/ui/cameraUi.ts',
  controlUi: 'src/nodes/player/ControlUISign.ts'
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, 'utf8')])
)

const checks = [
  {
    name: 'turnState exposes first-turn initializer',
    ok: /export function gstsServerInitializeFirstTurnIfNeeded\(\)/.test(source.turnState)
  },
  {
    name: 'ChessInit calls first-turn initializer from stage timer',
    ok: /gstsServerInitializeFirstTurnIfNeeded\(\)/.test(source.chessInit)
  },
  {
    name: 'playerCreate resets template control state to false',
    ok: /self\.set\('isControl', false\)/.test(source.playerCreate)
  },
  {
    name: 'first turn can fall back to black player when red player is absent in single-player test',
    ok: /else if \(hasBlackPlayer\) \{\s*targetPlayer = blackPlayer\s*targetIsRed = false\s*hasTargetPlayer = true\s*\}/s.test(
      source.turnState
    )
  },
  {
    name: 'turn switching keeps red player when black player is absent',
    ok: /else if \(hasRedPlayer\) \{\s*targetPlayer = redPlayer\s*targetIsRed = true\s*hasTargetPlayer = true\s*\}/s.test(
      source.turnState
    )
  },
  {
    name: 'turn switching keeps black player when red player is absent',
    ok: /else if \(hasBlackPlayer\) \{\s*targetPlayer = blackPlayer\s*targetIsRed = false\s*hasTargetPlayer = true\s*\}/s.test(
      source.turnState
    )
  },
  {
    name: 'turn switching no longer hard-codes player(1/2).set(isControl,true)',
    ok: !/player\([12]\)\.set\('isControl', true\)/.test(source.turnState)
  },
  {
    name: 'turn switching no longer hard-codes StageEntity.set(curPlayer, player(1/2))',
    ok: !/StageEntity\.set\('curPlayer', player\([12]\)\)/.test(source.turnState)
  },
  {
    name: 'timer handlers guard absent red/black player lists before [0]',
    ok:
      /if \(players\.length > 0\) \{\s*let player = players\[0\]/s.test(source.playerTimers) &&
      (source.playerTimers.match(/if \(players\.length > 0\)/g) || []).length >= 2
  },
  {
    name: 'camera uses triggering player faction to choose red/black camera',
    ok: /queryEntityFaction\(playerEntity\) == factionRed/.test(source.cameraUi)
  },
  {
    name: 'UI camera actions use eventSourceEntity instead of graph self',
    ok:
      /gstsServerSwitchToVerticalCamera\(_evt\.eventSourceEntity as typeof self\)/.test(
        source.controlUi
      ) &&
      /gstsServerToggleBattleCamera\(_evt\.eventSourceEntity as typeof self\)/.test(
        source.controlUi
      )
  }
]

const failed = checks.filter((check) => !check.ok)

if (failed.length > 0) {
  console.error('Turn/camera regression check failed:')
  for (const check of failed) console.error(`- ${check.name}`)
  process.exit(1)
}

console.log(`Turn/camera regression check passed (${checks.length} checks).`)
