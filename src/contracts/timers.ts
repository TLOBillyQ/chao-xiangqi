export const timersId = {
  red: 1073742475n,
  black: 1073742483n
}

//定时器名称
export const Tick_MoveActive = 'MoveActive'
export const Tick_OutCheck = 'OutCheck'
export const Tick_MoveActiveTriggerBefore = 'MoveActiveTriggerBefore'
//棋子移动态检测计时器（ChessInit 起，chessDestroy rematch 暂停/恢复包夹清 moveList）
export const Tick_CheckChessMove = 'CheckChessMovestage'

//readyToPlay(1849) 开局时停掉的「向对方同步当前状态」计时器（编辑器侧定义，本图只 stopTimer）
export const Tick_SendCurStageToOther = 'sendCurStageToOther'
//readyToPlay(1849) 开局起的「玩家退出探测」计时器（5s 循环）
export const Tick_PlayerExit = 'PlayerExit'

//全局倒计时名称（需与编辑器全局计时器同名）
export const GlobalTimer_RedCountdown = '红方倒计时'
export const GlobalTimer_BlackCountdown = '黑方倒计时'
