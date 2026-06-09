import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { PlayerEntity } from 'genshin-ts/definitions/nodes'

import * as UIControl from '../UIControlGroupId'

function gstsServerSetDirectionUiStatus(playerEntity: PlayerEntity, status: UIControlGroupStatus) {
  for (let i = 0; i < UIControl.allDirectionControlIds.length; i++) {
    playerEntity.setUiControlStatus(UIControl.allDirectionControlIds[idx(i)], status)
  }
}

function gstsServerSetPieceDirectionUiStatus(
  playerEntity: PlayerEntity,
  status: UIControlGroupStatus
) {
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.帅, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.士, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.象, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.马, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.车, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.炮, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.兵, status)
  playerEntity.setUiControlStatus(UIControl.redPieceDirectionUi.兵过河, status)

  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.帅, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.士, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.象, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.马, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.车, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.炮, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.兵, status)
  playerEntity.setUiControlStatus(UIControl.blackPieceDirectionUi.兵过河, status)
}

export function gstsServerActivateSwitchUI(playerEntity: PlayerEntity) {
  playerEntity.set('curDirIndex', 0)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.On)
}

export function gstsServerActivateDirectionUI(
  playerEntity: PlayerEntity,
  chessType: string,
  isRedPiece: boolean
) {
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)

  let dirList = UIControl.dirContrlId.车
  let pieceUi = UIControl.redPieceDirectionUi.车
  if (!isRedPiece) pieceUi = UIControl.blackPieceDirectionUi.车

  if (chessType == '马') {
    dirList = UIControl.dirContrlId.马
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.马
    else pieceUi = UIControl.blackPieceDirectionUi.马
  } else if (chessType == '炮') {
    dirList = UIControl.dirContrlId.炮
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.炮
    else pieceUi = UIControl.blackPieceDirectionUi.炮
  } else if (chessType == '象') {
    dirList = UIControl.dirContrlId.象
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.象
    else pieceUi = UIControl.blackPieceDirectionUi.象
  } else if (chessType == '士') {
    dirList = UIControl.dirContrlId.士
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.士
    else pieceUi = UIControl.blackPieceDirectionUi.士
  } else if (chessType == '帅') {
    dirList = UIControl.dirContrlId.帅
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.帅
    else pieceUi = UIControl.blackPieceDirectionUi.帅
  } else if (chessType == '兵') {
    dirList = UIControl.dirContrlId.兵
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.兵
    else pieceUi = UIControl.blackPieceDirectionUi.兵
  } else if (chessType == '兵过河') {
    dirList = UIControl.dirContrlId.兵过河
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.兵过河
    else pieceUi = UIControl.blackPieceDirectionUi.兵过河
  } else if (isRedPiece) {
    pieceUi = UIControl.redPieceDirectionUi.车
  } else {
    pieceUi = UIControl.blackPieceDirectionUi.车
  }

  playerEntity.setUiControlStatus(pieceUi, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(dirList[idx(0)], UIControlGroupStatus.On)
}

export function gstsServerHideUIByChargeBegin(playerEntity: PlayerEntity) {
  // 蓄力期间不能关闭 chargeBegin 控件组：该按钮绑定长按技能，
  // 玩家手指仍按在按钮上，关闭控件组会切断长按输入，技能立即中断并触发 StopCharge。
  playerEntity.setUiControlStatus(UIControl.chargeProgress, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
}

export function gstsServerHideUIByChargeStop(playerEntity: PlayerEntity) {
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.chargeProgress, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
}
