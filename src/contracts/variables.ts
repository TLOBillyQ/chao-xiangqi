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
  titleHiddenByRule: 'titleHiddenByRule',
  opponentNickname: '对方玩家昵称',
  //StagePanel 接管：准备状态 1=已准备/2=看规则/3=取消(闲逛)；未准备标记；本方看到的对方状态文案；本局积分
  playerStage: '玩家状态',
  notReady: '未准备',
  opponentStage: '对方玩家状态',
  curScore: 'CurScore'
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
