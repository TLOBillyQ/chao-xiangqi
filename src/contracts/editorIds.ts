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

//退出游戏（StagePanel 接管：Settle_Stage + 发 ExitGame 信号）
export const btn_exitGame = 1073742675n
//点赞按钮（StagePanel 接管：点按发 showLike 信号）
export const btn_showLike = 1073742674n
//局内查看规则（与 btn_viewRules 同走规则页）
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

//模拟退出（顶替已从游戏侧删除的 btn_test/1073743813）：手动触发"对手离场"结算引导
export const btn_simulateExit = 1073744808n
//规则悬浮交互页 + 其列表容器（StagePanel 接管负责打开）
export const ui_rulePage = 1073742934n
export const ui_rulePageList = 1073742937n
//点赞随机动效控件池（收到对方 showLike 时随机播一个；待局内核对是否仍在当前布局）
export const likeAnimControls = list('int', [
  1073742691, 1073742695, 1073742699, 1073742703, 1073742707, 1073742711
])
//对手退出游戏时的「对方玩家状态」文案
export const str_opponentExited = '对方已退出游戏'
