//红方阵营
// eslint-disable-next-line no-undef
export const factionRed = global.faction(1)
//黑方阵营
// eslint-disable-next-line no-undef
export const factionBlack = global.faction(4)

export const dirPrefabs = {
  red: prefabId(1077936132n),
  black: prefabId(1077936135n)
}

//预计落点指示预制体
export const landingPrefab = prefabId(1077936158n)

//标签id
export const EntityTag = {
  Piece: 1073741825n,
  Dir: 1073741826n
}

export const changeDir = {
  left: 1073742734n,
  right: 1073742737n
}

//蓄力按钮/蓄力条：必须用「游玩布局」(1073742453) 下的 ID——运行时每个玩家只生效一个布局，
//职业配置引用的是游玩布局（结算/测试按钮/切换视角等实测可见控件均为其子级）。
//「默认布局」下曾有一套同名副本（1073741988/1073741984，已从地图删除），编辑器控件
//面板默认显示的是默认布局，对副本 setUiControlStatus 在游戏里看不到任何效果。
//【编辑器侧已知问题】控件组 On 后按钮仍可能不可见：被同布局其他 UI 控件遮挡——
//层级/渲染顺序是编辑器布局属性，代码无 z-order API，须在编辑器调整。
//另：技能类按钮「不可用状态」素材为空时，技能冷却/不可用期间按钮渲染成透明。
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

//开局页面标题
export const ui_title = 1073742503n
//准备按钮（按钮样式内嵌动效，查看规则时需隐藏整组，否则动效盖在规则页上）
export const btn_Ready = 1073742516n
//开局页面的标题动效：标题隐藏时需一并关闭，否则特效仍在播放
//其中 2514 是全屏界面动效，层级恒在所有层级之上（含悬浮交互页），必须显式关闭
export const ui_titleFx1 = 1073742513n
export const ui_titleFxFull = 1073742514n
export const ui_titleFx2 = 1073742515n
//查看规则
export const btn_viewRules = 1073742518n
//开局页面敌方信息
export const ui_enemyInfo = 1073742517n
//规则悬浮交互页的关闭按钮
export const btn_closeRulePage = 1073742936n
//切换视角按钮：进行中在 垂直 / 斜45 视角间来回切换
export const btn_switchCamera = 1073744024n
//重开/再来一局按钮（胜利/失败面板内，标签「再来一局」）：点击重新进入对局，与「准备」一样切垂直视角
export const btn_reGame = 1073742690n

//播报文字消息控件
export const ui_broadcastRoot = 1073742874n
export const ui_broadcastText = 1073742471n
export const ui_broadcastFxFull = 1073742871n
export const ui_broadcastEnemy = 1073742872n
export const ui_broadcastMine = 1073742910n

// TODO: 以下 UI 常量暂未被代码引用，待 UI 功能实现后使用或清理
//退出游戏
export const btn_exitGame = 1073742675n
//点赞按钮
export const btn_showLike = 1073742674n
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

//==== 开局（readyToPlay / 历史图 1849）所需的编辑器侧资源 ====
//游玩布局：开局后把玩家从准备界面切到此布局（运行时控件均为其子级，见上方 chargeBegin 说明）
export const playLayout = 1073742453n
//开局准备点：开局时把双方玩家传送到此预设点（预设点索引空间，与上方 EntityTag.Dir 的数值相同纯属巧合，互不相关）
export const openingPresetPoint = 1073741826n
//开局环境配置序号
export const openingEnvironment = 1186988035n
//双方主视角物件镜头：实体 GUID + 物件镜头「条目名」（必须用条目名而非模板名，与 settlement 的「准备镜头」同理）
export const player1CameraEntityGuid = 1077937005n
export const player2CameraEntityGuid = 1077937007n
export const player1CameraEntry = '玩家1镜头'
export const player2CameraEntry = '玩家2镜头'

//==== 历史图 StagePanel / chessDestroy 接管所需 UI ====
//旧规则悬浮交互页关闭按钮；当前规则页关闭按钮为 1073742936，这里兼容历史图里的 1073742937
export const btn_closeRulePageLegacy = 1073742937n
//棋子出界播报面板
export const ui_outOfBoundsPanel = 1073742864n
