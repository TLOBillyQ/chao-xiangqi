import type { GstsConfig } from 'genshin-ts'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./src'],
  outDir: './dist',
  lang: 'zh-CN',
  inject: {
    playerId: 342478178,
    mapId: 1073741863,
    nodeGraphId: 1073741842
  }
}

export default config
