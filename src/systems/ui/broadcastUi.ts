import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import type { entity } from 'genshin-ts/runtime/value'

import * as UIControl from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'

export function gstsServerErrorMsg(msg: string, conplayer: entity, isMine: boolean) {
  conplayer.setUiControlStatus(UIControl.ui_broadcastRoot, UIControlGroupStatus.On)
  conplayer.setUiControlStatus(UIControl.ui_broadcastText, UIControlGroupStatus.On)
  //全屏动效
  conplayer.playUiAnimationOnControl(UIControl.ui_broadcastFxFull)

  if (!isMine) {
    conplayer.setUiControlStatus(UIControl.ui_broadcastEnemy, UIControlGroupStatus.On)
    conplayer.setUiControlStatus(UIControl.ui_broadcastMine, UIControlGroupStatus.Off)
  } else {
    conplayer.setUiControlStatus(UIControl.ui_broadcastEnemy, UIControlGroupStatus.Off)
    conplayer.setUiControlStatus(UIControl.ui_broadcastMine, UIControlGroupStatus.On)
  }
  getServerStageEntity().set('ErrorMsg', msg)
  setTimeout((_e) => {
    conplayer.setUiControlStatus(UIControl.ui_broadcastRoot, UIControlGroupStatus.Off)
  }, 3000)
}
