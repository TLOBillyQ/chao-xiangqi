import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { PlayerEntity } from 'genshin-ts/definitions/nodes'

import * as UIControl from '../UIControlGroupId'

function gstsServerSetDirUiStatus(playerEntity: PlayerEntity, status: UIControlGroupStatus) {
  for (let i = 0; i < UIControl.dirContrlId.车.length; i++) {
    playerEntity.setUiControlStatus(UIControl.dirContrlId.车[idx(i)], status)
  }
  for (let i = 0; i < UIControl.dirContrlId.马.length; i++) {
    playerEntity.setUiControlStatus(UIControl.dirContrlId.马[idx(i)], status)
  }
}

export function gstsServerActiviteChangeUI(playerEntity: PlayerEntity) {
  playerEntity.set('curDirIndex', 0)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.On)
}

export function gstsServerActiviteDirUI(playerEntity: PlayerEntity, chessType: string) {
  gstsServerSetDirUiStatus(playerEntity, UIControlGroupStatus.Off)

  let dirList = UIControl.dirContrlId.车
  if (chessType == '马') dirList = UIControl.dirContrlId.马
  else if (chessType == '炮') dirList = UIControl.dirContrlId.炮
  else if (chessType == '象') dirList = UIControl.dirContrlId.象
  else if (chessType == '士') dirList = UIControl.dirContrlId.士
  else if (chessType == '帅') dirList = UIControl.dirContrlId.帅
  else if (chessType == '兵') dirList = UIControl.dirContrlId.兵
  else if (chessType == '兵过河') dirList = UIControl.dirContrlId.兵过河

  playerEntity.setUiControlStatus(dirList[idx(0)], UIControlGroupStatus.On)
}

export function gstsServerHideUIByChargeBegin(playerEntity: PlayerEntity) {
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.chargeJinDu, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirUiStatus(playerEntity, UIControlGroupStatus.Off)
}

export function gstsServerHideUIByChargeStop(playerEntity: PlayerEntity) {
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.chargeJinDu, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirUiStatus(playerEntity, UIControlGroupStatus.Off)
}

export function gstsServerShowVictoryDep(playerEntity: PlayerEntity) {
  playerEntity.setUiControlStatus(UIControl.id_JieSuan, UIControlGroupStatus.On)
}

export function gstsServerShowDefeatDep(playerEntity: PlayerEntity) {
  playerEntity.setUiControlStatus(UIControl.id_JieSuan, UIControlGroupStatus.On)
}
