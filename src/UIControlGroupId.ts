export const changeDir = {
  left: 1073742734n,
  right: 1073742737n
}

//蓄力按钮
export const chargeBegin = 1073742797n
export const chargeJinDu = 1073742741n

export const theEightDir = {
  top: 1073742745,
  topright: 1073742746,
  right: 1073742747,
  floorright: 1073742748,
  floor: 1073742749,
  floorleft: 1073742750,
  left: 1073742751,
  topleft: 1073742752
}

const theEightDir_ma = {
  top: 1073742779,
  topright: 1073742772,
  right: 1073742773,
  floorright: 1073742774,
  floor: 1073742775,
  floorleft: 1073742776,
  left: 1073742777,
  topleft: 1073742778
}

export const dirContrlId = {
  车: list('int', [theEightDir.top, theEightDir.right, theEightDir.floor, theEightDir.left]),
  炮: list('int', [theEightDir.top, theEightDir.right, theEightDir.floor, theEightDir.left]),
  帅: list('int', [theEightDir.top, theEightDir.right, theEightDir.floor, theEightDir.left]),
  兵: list('int', [theEightDir.top]),
  兵过河: list('int', [theEightDir.top, theEightDir.right, theEightDir.left]),
  象: list('int', [
    theEightDir.topleft,
    theEightDir.topright,
    theEightDir.floorright,
    theEightDir.floorleft
  ]),
  士: list('int', [
    theEightDir.topleft,
    theEightDir.topright,
    theEightDir.floorright,
    theEightDir.floorleft
  ]),
  马: list('int', [
    theEightDir_ma.top,
    theEightDir_ma.topright,
    theEightDir_ma.right,
    theEightDir_ma.floorright,
    theEightDir_ma.floor,
    theEightDir_ma.floorleft,
    theEightDir_ma.left,
    theEightDir_ma.topleft
  ])
}

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
export const btn_LookRule = 1073742518n
//局内查看规则
export const btn_LookRuleInGame = 1073742875n

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
