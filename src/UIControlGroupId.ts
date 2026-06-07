export const changeDir = {
  left: 1073742734n,
  right: 1073742737n
}

//蓄力按钮
export const chargeBegin = 1073742797n
export const chargeJinDu = 1073742741n

//光效母舰
export const theEightDirmother = 1073742744n

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

//光效母舰——马
export const theEightDirmother_ma = 1073742771n

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

//红方底图字典
function gstsServerChessFloorDicRed() {
  const dic = dict({
    车: 1073742766n,
    炮: 1073742767n,
    帅: 1073742762n,
    兵: 1073742768n,
    兵过河: 1073742769n,
    象: 1073742764n,
    士: 1073742763n,
    马: 1073742765n
  })

  return dic
}

//黑方底图字典
function gstsServerChessFloorDicBlack() {
  const dic = dict({
    车: 1073742759n,
    炮: 1073742760n,
    帅: 1073742755n,
    兵: 1073742761n,
    兵过河: 1073742770n,
    象: 1073742757n,
    士: 1073742756n,
    马: 1073742758n
  })

  return dic
}

/**
 * 获取棋子的底盘图片id
 * @param chessType 棋子类型
 */
export function gstsServerDirGetChessIdRed(chessType: string) {
  const dic = gstsServerChessFloorDicRed()
  return dic.get(chessType)
}

/**
 * 获取棋子的方向地图id列表
 * @returns
 */
export function gstsServerChessIdValueRed() {
  const dic = gstsServerChessFloorDicRed()
  return gsts.f.getListOfValuesFromDictionary(dic)
}

/**
 * 获取棋子的底盘图片id（黑
 * @param chessType 棋子类型
 */
export function gstsServerDirGetChessIdBlack(chessType: string) {
  const dic = gstsServerChessFloorDicBlack()
  return dic.get(chessType)
}

/**
 * 获取棋子的方向地图id列表(黑)
 * @returns
 */
export function gstsServerChessIdValueBlack() {
  const dic = gstsServerChessFloorDicBlack()
  return gsts.f.getListOfValuesFromDictionary(dic)
}

/**
 * 获取棋子的方向UI控件列表
 * @param chessType 棋子类型
 * @returns
 */
export function ServerDirEffectIndexList(chessType: string) {
  const dirContrlIdDic = dict({
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
  })
  return dirContrlIdDic.get(chessType)
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
  //马:list("int",[1111n,22n])
}

//点赞组件
export const showLikeIndex = list(
  'int',
  [1073742691, 1073742695, 1073742699, 1073742703, 1073742707, 1073742711]
)

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

export const id_JieSuan = 1073743811n

export const btn_test = 1073743813n
