export const StageVar = {
  moveList: 'moveList',
  curPlayer: 'curPlayer',
  canChange: 'canChange',
  settled: 'settled',
  errorMsg: 'ErrorMsg',
  angleRand: 'AngleRand'
} as const

export const PlayerVar = {
  isControl: 'isControl',
  isCharge: 'ischarge',
  chargePower: 'chargePower',
  curDirIndex: 'curDirIndex',
  curChooseChess: 'curChooseChess',
  curChessType: 'curChessType',
  startPos: 'startPos',
  step: 'step',
  isVerticalCam: 'isVerticalCam',
  titleHiddenByRule: 'titleHiddenByRule'
} as const

export const PieceVar = {
  moveVec: 'moveVec',
  mass: 'Mass',
  pieceType: '棋子类型',
  isStart: 'isStart',
  isOut: 'isOut',
  triggerCount: 'triggerCount',
  triggerGuidList: 'triggerGuidList',
  initSpeed: 'initSpeed',
  scanEntity: 'ScanEntity'
} as const

export const DirectionVar = {
  moveVec: 'moveVec',
  dirUIIndex: 'dirUIIndex'
} as const
