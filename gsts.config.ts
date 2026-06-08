import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  lang: 'zh-CN',
  inject: {
    playerId: 342482779,
    mapId: 1073741826,
    nodeGraphId: 1073741842
  }
}

export default config
