import { g } from 'genshin-ts/runtime/core'

g.server({
  id: 1073741840,
}).on('whenUiControlGroupIsTriggered', (_evt, f) => {
  send('MoveForward')
})
