export const changeDir = {
  left: 1073742734n,
  right: 1073742737n
}

//蓄力按钮
export const chargeBegin = 1073742797n
export const chargeProgress = 1073742741n

export const theEightDir = {
  top: 1073742745,
  topRight: 1073742746,
  right: 1073742747,
  bottomRight: 1073742748,
  bottom: 1073742749,
  bottomLeft: 1073742750,
  left: 1073742751,
  topLeft: 1073742752
}

const eightDirKnight = {
  top: 1073742779,
  topRight: 1073742772,
  right: 1073742773,
  bottomRight: 1073742774,
  bottom: 1073742775,
  bottomLeft: 1073742776,
  left: 1073742777,
  topLeft: 1073742778
}

export const allDirectionControlIds = list('int', [
  theEightDir.top,
  theEightDir.topRight,
  theEightDir.right,
  theEightDir.bottomRight,
  theEightDir.bottom,
  theEightDir.bottomLeft,
  theEightDir.left,
  theEightDir.topLeft,
  eightDirKnight.top,
  eightDirKnight.topRight,
  eightDirKnight.right,
  eightDirKnight.bottomRight,
  eightDirKnight.bottom,
  eightDirKnight.bottomLeft,
  eightDirKnight.left,
  eightDirKnight.topLeft
])

export const dirContrlId = {
  车: list('int', [theEightDir.top, theEightDir.right, theEightDir.bottom, theEightDir.left]),
  炮: list('int', [theEightDir.top, theEightDir.right, theEightDir.bottom, theEightDir.left]),
  帅: list('int', [theEightDir.top, theEightDir.right, theEightDir.bottom, theEightDir.left]),
  兵: list('int', [theEightDir.top]),
  兵过河: list('int', [theEightDir.top, theEightDir.right, theEightDir.left]),
  象: list('int', [
    theEightDir.topLeft,
    theEightDir.topRight,
    theEightDir.bottomRight,
    theEightDir.bottomLeft
  ]),
  士: list('int', [
    theEightDir.topLeft,
    theEightDir.topRight,
    theEightDir.bottomRight,
    theEightDir.bottomLeft
  ]),
  马: list('int', [
    eightDirKnight.top,
    eightDirKnight.topRight,
    eightDirKnight.right,
    eightDirKnight.bottomRight,
    eightDirKnight.bottom,
    eightDirKnight.bottomLeft,
    eightDirKnight.left,
    eightDirKnight.topLeft
  ])
}

export const redPieceDirectionUi = {
  帅: 1073742762n,
  士: 1073742763n,
  象: 1073742764n, // 红相
  马: 1073742765n,
  车: 1073742766n,
  炮: 1073742767n,
  兵: 1073742768n,
  兵过河: 1073742769n
}

export const blackPieceDirectionUi = {
  帅: 1073742755n, // 黑将
  士: 1073742756n,
  象: 1073742757n,
  马: 1073742758n,
  车: 1073742759n,
  炮: 1073742760n,
  兵: 1073742761n, // 黑卒
  兵过河: 1073742770n // 过河卒
}

//结算按钮：满足结算条件后显示，点击它才真正结算（settleStage）
export const btn_settle = 1073743811n
//胜利面板：结算时给赢家显示
export const ui_winPanel = 1073742676n
//失败面板：结算时给输家显示
export const ui_losePanel = 1073742720n

// TODO: 以下 UI 常量暂未被代码引用，待 UI 功能实现后使用或清理
//重开按钮
export const btn_reGame = 1073742690n
//退出游戏
export const btn_exitGame = 1073742675n
//点赞按钮
export const btn_showLike = 1073742674n
//准备按钮
export const btn_Ready = 1073742516n
//查看规则
export const btn_viewRules = 1073742518n
//局内查看规则
export const btn_viewRulesInGame = 1073742875n

export const str_playerWait = list('str', [
  '对方正在闲逛',
  '对方正在摇头晃脑',
  '对方抖了一抖腿',
  '对方吓了一跳'
])

export const str_playerIsReady = '对方准备好了'
export const str_playerLookRule = '对方正在查看规则'

//播报文字消息控件
export const id_broadList = list(
  'int',
  [1073742853, 1073742854, 1073742852, 1073742855, 1073742856]
)

export const btn_test = 1073743813n
