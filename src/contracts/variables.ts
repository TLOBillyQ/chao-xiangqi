export const StageVar = {
  moveList: 'moveList',
  curPlayer: 'curPlayer',
  settled: 'settled',
  errorMsg: 'ErrorMsg',
  angleRand: 'AngleRand',
  //两轴生命周期（关卡实体 float），取代旧 GameStage(1/2/3)+canChange+turnInitialized。ADR-0003。
  matchPhase: 'matchPhase',
  turnPhase: 'turnPhase',
  //chessDestroy(1850)：出界播报三队列 + 播报者昵称（均挂关卡实体）
  outBroadcastFaction: '播报-出界阵营',
  outBroadcastPiece: '播报-出界棋子',
  outBroadcastRemain: '播报-剩余棋子',
  outBroadcasterNick: '出界播报玩家昵称'
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
  //chessDestroy(1850)：每方剩余棋子数（出界递减，rematch 重置 16）
  remainPieces: '剩余棋子',
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
  //棋子阵营字符串（chessDestroy 从销毁快照读，入出界播报队列）
  faction: '阵营',
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
