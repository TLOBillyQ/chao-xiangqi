import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import * as UIControl from '../../contracts/editorIds'

type UiEntity = Pick<typeof self, 'get' | 'set' | 'setUiControlStatus'>

function gstsServerSetDirectionUiStatus(playerEntity: UiEntity, status: UIControlGroupStatus) {
  for (let i = 0; i < UIControl.allDirectionControlIds.length; i++) {
    playerEntity.setUiControlStatus(UIControl.allDirectionControlIds[idx(i)], status)
  }
}

function gstsServerSetPieceDirectionUiStatus(playerEntity: UiEntity, status: UIControlGroupStatus) {
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

function gstsServerGetDirectionControlList(chessType: string) {
  let dirList = UIControl.dirContrlId.车
  if (chessType == '马') dirList = UIControl.dirContrlId.马
  else if (chessType === '炮') dirList = UIControl.dirContrlId.炮
  else if (chessType === '象') dirList = UIControl.dirContrlId.象
  else if (chessType === '士') dirList = UIControl.dirContrlId.士
  else if (chessType === '帅') dirList = UIControl.dirContrlId.帅
  else if (chessType === '兵') dirList = UIControl.dirContrlId.兵
  else if (chessType === '兵过河') dirList = UIControl.dirContrlId.兵过河

  return dirList
}

export function gstsServerActivateSwitchUI(playerEntity: UiEntity) {
  playerEntity.set('curDirIndex', 0)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.On)
}

export function gstsServerActivateDirectionUI(
  playerEntity: UiEntity,
  chessType: string,
  isRedPiece: boolean
) {
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)

  let dirList = gstsServerGetDirectionControlList(chessType)
  let pieceUi = UIControl.redPieceDirectionUi.车
  if (!isRedPiece) pieceUi = UIControl.blackPieceDirectionUi.车

  if (chessType == '马') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.马
    else pieceUi = UIControl.blackPieceDirectionUi.马
  } else if (chessType == '炮') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.炮
    else pieceUi = UIControl.blackPieceDirectionUi.炮
  } else if (chessType == '象') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.象
    else pieceUi = UIControl.blackPieceDirectionUi.象
  } else if (chessType == '士') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.士
    else pieceUi = UIControl.blackPieceDirectionUi.士
  } else if (chessType == '帅') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.帅
    else pieceUi = UIControl.blackPieceDirectionUi.帅
  } else if (chessType == '兵') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.兵
    else pieceUi = UIControl.blackPieceDirectionUi.兵
  } else if (chessType == '兵过河') {
    if (isRedPiece) pieceUi = UIControl.redPieceDirectionUi.兵过河
    else pieceUi = UIControl.blackPieceDirectionUi.兵过河
  }

  playerEntity.setUiControlStatus(pieceUi, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(dirList[idx(0)], UIControlGroupStatus.On)
}

export function gstsServerHideUIByChargeBegin(playerEntity: UiEntity) {
  // 蓄力期间不能关闭 chargeBegin 控件组：该按钮绑定长按技能，
  // 玩家手指仍按在按钮上，关闭控件组会切断长按输入，技能立即中断并触发 StopCharge。
  playerEntity.setUiControlStatus(UIControl.chargeProgress, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
}

export function gstsServerHideUIByChargeStop(playerEntity: UiEntity) {
  playerEntity.setUiControlStatus(UIControl.chargeBegin, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.chargeProgress, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.left, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.changeDir.right, UIControlGroupStatus.Off)
  gstsServerSetDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
  gstsServerSetPieceDirectionUiStatus(playerEntity, UIControlGroupStatus.Off)
}

export function gstsServerSwitchDirectionUI(playerEntity: UiEntity, isLeft: boolean) {
  const curChooseChessType = playerEntity.get('curChessType').asType('str')
  let curDirIndex = playerEntity.get('curDirIndex').asType('float')
  let dirList = gstsServerGetDirectionControlList(curChooseChessType)
  let newIndex = curDirIndex

  playerEntity.setUiControlStatus(dirList[idx(int(curDirIndex))], UIControlGroupStatus.Off)
  if (isLeft) {
    newIndex = curDirIndex - 1
    let length = Number(dirList.length)
    if (newIndex < 0) newIndex = length - 1
  } else {
    newIndex = curDirIndex + 1
    let length = Number(dirList.length)
    if (newIndex > length - 1) newIndex = 0
  }

  playerEntity.set('curDirIndex', newIndex)
  playerEntity.setUiControlStatus(dirList[idx(int(newIndex))], UIControlGroupStatus.On)
}
