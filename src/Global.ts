import { faction, ReadonlyDict } from "genshin-ts/runtime/value"



// 环境变量 0测试 1正式
export let environment = 1
//当前游戏状态
export const EnumgameStage = 
{
    ready:1,//准备
    game:2, //游戏中
    settlement:3 //结算
}


//玩家状态
export const EnumPlayerStage = 
{
    isReady:1,//已准备
    lookRule:2, //查看规则
    wait:3 //等待
}

//红方阵营
export const factionRed = global.faction(1)
//黑方阵营
export const factionBlack = global.faction(4)



export const radius = 1.0
//export const e = 0.92 //碰撞恢复系数
export const e = 0.93 //碰撞恢复系数
export const deltaT = 0.03

//角阻尼系数
export const deltaAng = 3.0
//运动阻尼
export const deltaMove = 4.0
//运动阻尼
export const deltaMoveTriggerBefore = 2.0

export const gridWallTop = 3
export const gridWallFloor = 3
export const gridWallLeft = 3
export const gridWallRight = 3

export const gridNormalization = 3.1
export const chargeMaxTime = 3.0

export const timersId = 
{
    red:1073742475n,
    black:1073742483n
}

export const dirPrefabs = 
{
    red:prefabId(1077936132n),
    black:prefabId(1077936135n)
}

/**
 * 获取关卡实体
 */
export function getServerStageEntity()
{
    return gsts.f.queryEntityByGuid(1094713345n)
}


//初始象棋坐标
export const initPos = 
{
    红方坐标:list("vec3",[
        [0,0,0], [0,0,8], // 车
        [0,0,1], [0,0,7], // 马
        [0,0,2], [0,0,6], // 象
        [0,0,3], [0,0,5], // 士
        [0,0,4], // 帅
        [-2,0,1], [-2,0,7], // 炮
        [-3,0,0], [-3,0,2], [-3,0,4], [-3,0,6], [-3,0,8] // 兵
    ]),
    红方名称:list("prefab_id",[
        1077936137, 1077936137, //车
        1077936138, 1077936138, //马
        1077936139, 1077936139, //象
        1077936141, 1077936141,//"士", "士",
        1077936146,//"帅",
        1077936140, 1077936140,//"炮", "炮",
        1077936136, 1077936136, 1077936136, 1077936136, 1077936136 //兵
    ]),
    黑方坐标:list("vec3",[
        [-9,0,0], [-9,0,8], // 车
        [-9,0,1], [-9,0,7], // 马
        [-9,0,2], [-9,0,6], // 象
        [-9,0,3], [-9,0,5], // 士
        [-9,0,4], // 将
        [-7,0,1], [-7,0,7], // 炮
        [-6,0,0], [-6,0,2], [-6,0,4], [-6,0,6], [-6,0,8] // 卒
    ]),
    黑方名称:list("prefab_id",[
        1077936143,1077936143,//"车", "车",
        1077936144,1077936144,//"马", "马",
        1077936145,1077936145,//"象", "象",
        1077936148,1077936148,//"士", "士",
        1077936149,//"将",
        1077936147,1077936147,//"炮", "炮",
        1077936142,1077936142,1077936142,1077936142,1077936142//"卒", "卒", "卒", "卒", "卒"
    ])
}

export const firstChessPos = vec3([-2.73,5.44,-1.26])
//一格长度
export const chessInterval = 3

export function gsteServerpieceDirections_red(chessType:string){
    let pieceDirections_red = dict(
        {
            车: list("vec3",[[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]),
            马: list("vec3",[[-1, 2, 0], [1, 2, 0], [2, 1, 0],[2, -1, 0], [1, -2, 0],[-1, -2, 0], [-2, -1, 0],[-2, 1, 0]]),
            象: list("vec3",[[-2, 2, 0], [2, 2, 0], [2, -2, 0], [-2, -2, 0]]),
            士: list("vec3",[[-1, 1, 0], [1, 1, 0], [1, -1, 0], [-1, -1, 0]]),
            帅: list("vec3",[[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]),
            炮: list("vec3",[[0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]]),
            兵: list("vec3",[[0, 1, 0]]),
            兵过河: list("vec3",[[0, 1, 0], [1, 0, 0], [-1, 0, 0]]),
        }
    )

    let diclist = pieceDirections_red.get(chessType)
    // if (str(fa) == "4")
    // {
    //     diclist = pieceDirections_black.get(chessType)
    // }


    return diclist
}

export function gsteServerpieceDirections_black(chessType:string){
    const pieceDirections = dict(
        {
            车: list("vec3",[[0, -1, 0], [-1, 0, 0], [0, 1, 0], [1, 0, 0]]),
            马: list("vec3",[[1, -2, 0],[-1, -2, 0], [-2, -1, 0],[-2, 1, 0], [-1, 2, 0],[1, 2, 0], [2, 1, 0], [2, -1, 0]]),
            象: list("vec3",[[2, -2, 0], [-2, -2, 0], [-2, 2, 0], [2, 2, 0]]),
            士: list("vec3",[[1, -1, 0], [-1, -1, 0], [-1, 1, 0], [1, 1, 0]]),
            帅: list("vec3",[[0, -1, 0], [-1, 0, 0], [0, 1, 0], [1, 0, 0]]),
            炮: list("vec3",[[0, -1, 0], [-1, 0, 0], [0, 1, 0], [1, 0, 0]]),
            兵: list("vec3",[[0, -1, 0]]),
            兵过河: list("vec3",[[0, -1, 0], [-1, 0, 0], [1, 0, 0]]),
        }
    )
    return pieceDirections.get(chessType)
}

//棋盘墙壁
export const Wall = 
{
    leftz:-3.76,
    rightz:25.1,
    topx:-30.42,
    floorx:-1.13,
    center:-16.16
}

//九宫格墙壁

export function gsteServerGetNineWall(fac:faction)
{
    const NineWall = dict([{ k: factionRed, v: list("float",[6.2,15.40,-9.28])},
    { k: factionBlack, v: list("float",[6.2,15.40,-22.73])}])
    return NineWall.get(fac)
}


export const DurchlassentityGuid = 1094713345n

//标签id 
export const EntityTag = {
    QiZi:1073741825n,
    Dir:1073741826n
}


//定时器名称
export const Tick_MoveActive = "MoveActive"
export const Tick_OutCheck = "OutCheck"
export const Tick_MoveActiveTriggerBefore = "MoveActiveTriggerBefore"


//用于底层目录读取对象
export function Getglobal()
{
  return global
}


export function GetBeginSpeed(chessType:string)
{
    const dictspeed =  dict(
        {
            车: 20,
            马: 20,
            象: 20,
            士: 20,
            帅: 20,
            炮: 20,
            兵: 20,
            兵过河: 20,
        }
    )

    return dictspeed.get(chessType)
}