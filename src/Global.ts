//红方阵营
// eslint-disable-next-line no-undef
export const factionRed = global.faction(1)
//黑方阵营
// eslint-disable-next-line no-undef
export const factionBlack = global.faction(4)

export const radius = 1.0
export const e = 0.93 //碰撞恢复系数
export const deltaT = 0.03

//运动阻尼
export const deltaMove = 4.0
//运动阻尼
export const deltaMoveTriggerBefore = 2.0

export const timersId = {
  red: 1073742475n,
  black: 1073742483n
}

export const dirPrefabs = {
  red: prefabId(1077936132n),
  black: prefabId(1077936135n)
}

/**
 * 获取关卡实体
 */
export function getServerStageEntity() {
  // eslint-disable-next-line gsts/no-gsts-f-outside-server
  return gsts.f.queryEntityByGuid(1094713345n)
}

//初始象棋坐标
export const initPos = {
  红方坐标: list('vec3', [
    [0, 0, 0],
    [0, 0, 8], // 车
    [0, 0, 1],
    [0, 0, 7], // 马
    [0, 0, 2],
    [0, 0, 6], // 象
    [0, 0, 3],
    [0, 0, 5], // 士
    [0, 0, 4], // 帅
    [-2, 0, 1],
    [-2, 0, 7], // 炮
    [-3, 0, 0],
    [-3, 0, 2],
    [-3, 0, 4],
    [-3, 0, 6],
    [-3, 0, 8] // 兵
  ]),
  红方名称: list('prefab_id', [
    1077936137,
    1077936137, //车
    1077936138,
    1077936138, //马
    1077936139,
    1077936139, //象
    1077936141,
    1077936141, //"士", "士",
    1077936146, //"帅",
    1077936140,
    1077936140, //"炮", "炮",
    1077936136,
    1077936136,
    1077936136,
    1077936136,
    1077936136 //兵
  ]),
  黑方坐标: list('vec3', [
    [-9, 0, 0],
    [-9, 0, 8], // 车
    [-9, 0, 1],
    [-9, 0, 7], // 马
    [-9, 0, 2],
    [-9, 0, 6], // 象
    [-9, 0, 3],
    [-9, 0, 5], // 士
    [-9, 0, 4], // 将
    [-7, 0, 1],
    [-7, 0, 7], // 炮
    [-6, 0, 0],
    [-6, 0, 2],
    [-6, 0, 4],
    [-6, 0, 6],
    [-6, 0, 8] // 卒
  ]),
  黑方名称: list('prefab_id', [
    1077936143,
    1077936143, //"车", "车",
    1077936144,
    1077936144, //"马", "马",
    1077936145,
    1077936145, //"象", "象",
    1077936148,
    1077936148, //"士", "士",
    1077936149, //"将",
    1077936147,
    1077936147, //"炮", "炮",
    1077936142,
    1077936142,
    1077936142,
    1077936142,
    1077936142 //"卒", "卒", "卒", "卒", "卒"
  ])
}

export const firstChessPos = vec3([-2.73, 5.44, -1.26])
//一格长度
export const chessInterval = 3

export function gstsServerRedPieceDirections(chessType: string) {
  const redPieceDirections = dict({
    车: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    马: list('vec3', [
      [-1, 2, 0],
      [1, 2, 0],
      [2, 1, 0],
      [2, -1, 0],
      [1, -2, 0],
      [-1, -2, 0],
      [-2, -1, 0],
      [-2, 1, 0]
    ]),
    象: list('vec3', [
      [-2, 2, 0],
      [2, 2, 0],
      [2, -2, 0],
      [-2, -2, 0]
    ]),
    士: list('vec3', [
      [-1, 1, 0],
      [1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0]
    ]),
    帅: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    炮: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    兵: list('vec3', [[0, 1, 0]]),
    兵过河: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [-1, 0, 0]
    ])
  })

  const diclist = redPieceDirections.get(chessType)

  return diclist
}

export function gstsServerBlackPieceDirections(chessType: string) {
  const blackPieceDirections = dict({
    车: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    马: list('vec3', [
      [1, -2, 0],
      [-1, -2, 0],
      [-2, -1, 0],
      [-2, 1, 0],
      [-1, 2, 0],
      [1, 2, 0],
      [2, 1, 0],
      [2, -1, 0]
    ]),
    象: list('vec3', [
      [2, -2, 0],
      [-2, -2, 0],
      [-2, 2, 0],
      [2, 2, 0]
    ]),
    士: list('vec3', [
      [1, -1, 0],
      [-1, -1, 0],
      [-1, 1, 0],
      [1, 1, 0]
    ]),
    帅: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    炮: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    兵: list('vec3', [[0, -1, 0]]),
    兵过河: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [1, 0, 0]
    ])
  })
  return blackPieceDirections.get(chessType)
}

//棋盘墙壁
export const Wall = {
  leftz: -3.76,
  rightz: 25.1,
  topx: -30.42,
  bottomX: -1.13,
  center: -16.16
}

//标签id
export const EntityTag = {
  Piece: 1073741825n,
  Dir: 1073741826n
}

//定时器名称
export const Tick_MoveActive = 'MoveActive'
export const Tick_OutCheck = 'OutCheck'
export const Tick_MoveActiveTriggerBefore = 'MoveActiveTriggerBefore'
