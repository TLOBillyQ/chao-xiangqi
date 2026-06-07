import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'

const playerId = 342478178
const mapId = 1073741861
const localAppData =
  process.env.LOCALAPPDATA ?? join(process.env.USERPROFILE ?? '', 'AppData', 'Local')
const mapPath = normalize(
  join(
    localAppData,
    '..',
    'LocalLow',
    'miHoYo',
    '原神',
    'BeyondLocal',
    String(playerId),
    'Beyond_Local_Save_Level',
    `${mapId}.gil`
  )
)

function snapshot(label) {
  if (!existsSync(mapPath)) {
    throw new Error(`Map file not found: ${mapPath}`)
  }

  const stat = statSync(mapPath)
  return {
    label,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    mtime: stat.mtime.toLocaleString()
  }
}

const before = snapshot('before')
console.log(`[inject:verify] target: ${mapPath}`)
console.log(`[inject:verify] before: size=${before.size}, mtime=${before.mtime}`)

const command = process.platform === 'win32' ? 'cmd.exe' : 'npm'
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build']
const result = spawnSync(command, args, {
  cwd: process.cwd(),
  stdio: 'inherit'
})

const after = snapshot('after')
console.log(`[inject:verify] after:  size=${after.size}, mtime=${after.mtime}`)

if (result.status !== 0) {
  if (result.error) {
    console.error(`[inject:verify] build command failed: ${result.error.message}`)
  } else {
    console.error(`[inject:verify] build command exited with status ${result.status}`)
  }
  process.exit(result.status ?? 1)
}

if (after.mtimeMs <= before.mtimeMs && after.size === before.size) {
  console.error('[inject:verify] failed: map file timestamp and size did not change')
  process.exit(1)
}

console.log('[inject:verify] ok: map file changed after gsts injection')
