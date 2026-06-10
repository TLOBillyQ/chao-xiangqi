import { SettlementStatus, UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import { factionRed, getServerStageEntity } from '../Global'
import { btn_settle, ui_losePanel, ui_winPanel } from '../UIControlGroupId'

/**
 * 满足结算条件 → 显示结算 UI（不立即结算）。
 *
 * 流程：满足条件时给在场玩家弹出结算面板（赢家胜利面板、输家失败面板）与「结算」按钮，
 * 真正的关卡结算延迟到玩家点击「结算」按钮（见 gstsServerConfirmSettle）。胜负结果存到 stage
 * 的 redWin 变量，供点击时读回。
 *
 * 用 stage 上的 settled 变量做一次性保护——所有结算入口（玩家退出 / 将帅被吃 / 对方缺席超时）
 * 都走本函数，保证整局只弹一次结算 UI。settled / redWin 在 ChessInit 创建时初始化。
 *
 * UI 只对在场玩家逐个发放：单人局另一名玩家不存在、离场场景下离场方实体已失效，
 * 对无效实体调用 UI 节点可能中断执行链；按钮先于面板发放，保证「结算」按钮不被后续节点失败牵连。
 *
 * 前置（编辑器侧）：界面控件组库内需有「胜利面板」(ui_winPanel)、「失败面板」(ui_losePanel)
 * 与「结算」交互按钮(btn_settle)三套控件，并已加入对应玩家的界面布局。
 *
 * @param redWin 红方是否获胜（false 则黑方胜）
 */
export function gstsServerSettleGame(redWin: boolean) {
  let stage = getServerStageEntity()
  if (!stage.get('settled').asType('bool')) {
    stage.set('settled', true)
    stage.set('redWin', redWin)
    let players = gsts.f.getListOfPlayerEntitiesOnTheField()
    for (let i = 0; i < players.length; i++) {
      let p = players[i]
      p.setUiControlStatus(btn_settle, UIControlGroupStatus.On)
      let isRed = gsts.f.queryEntityFaction(p) == factionRed
      let showWin = false
      if (isRed && redWin) showWin = true
      if (!isRed && !redWin) showWin = true
      if (showWin) {
        p.setUiControlStatus(ui_winPanel, UIControlGroupStatus.On)
      } else {
        p.setUiControlStatus(ui_losePanel, UIControlGroupStatus.On)
      }
    }
  }
}

/**
 * 玩家点击「结算」按钮后真正结算整局（个人结算）：胜方判胜、败方判负，弹出关卡结算页。
 *
 * 由玩家节点图的「界面控件组触发时」事件在 uiControlGroupIndex == btn_settle 时调用。
 * 胜负从 stage 的 redWin 变量读回（在 gstsServerSettleGame 显示 UI 时已写入）。
 * 只对在场玩家设置胜负：对不存在/已离场玩家实体调用节点可能中断执行链，导致 settleStage 不执行。
 *
 * 前置（编辑器侧）：【关卡设置 - 结算】结算界面类型为「个人结算」；计分模板 / 排名展示
 * 需在结算页签内预先配置，否则仅结束对局而无展示数据。
 */
export function gstsServerConfirmSettle() {
  let stage = getServerStageEntity()
  let redWin = stage.get('redWin').asType('bool')
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  for (let i = 0; i < players.length; i++) {
    let p = players[i]
    let isRed = gsts.f.queryEntityFaction(p) == factionRed
    let isWinner = false
    if (isRed && redWin) isWinner = true
    if (!isRed && !redWin) isWinner = true
    if (isWinner) {
      gsts.f.setPlayerSettlementSuccessStatus(p, SettlementStatus.Victory)
    } else {
      gsts.f.setPlayerSettlementSuccessStatus(p, SettlementStatus.Defeat)
    }
  }
  gsts.f.settleStage()
}

//对方缺席判定的等待周期数。注意：CheckChessMovestage 计时器实测约 1 秒/跳——
//startTimer 传入的间隔参数不生效，真实间隔由编辑器计时器管理决定（2026-06-10 日志实测 1.09s/tick）。
//60 周期 ≈ 1 分钟；要调等待时长改这里
const OPPONENT_WAIT_TICKS = 60

/**
 * 对方不存在（从未加入）超时判定：开局后等满 OPPONENT_WAIT_TICKS 个计时器周期仍未满员、
 * 且场上只有 1 名玩家时，该玩家直接获得结算 UI（结算按钮+胜利面板）。
 *
 * 由 ChessInit 的计时器事件调用（实测约 1 秒/次，间隔由编辑器计时器管理决定）。
 * 对局一旦满员（bothJoined）或已结算则永久停用。
 */
export function gstsServerSettleIfOpponentAbsent() {
  let stage = getServerStageEntity()
  if (!stage.get('settled').asType('bool')) {
    if (!stage.get('bothJoined').asType('bool')) {
      let waited = stage.get('waitTicks').asType('float') + 1
      stage.set('waitTicks', waited)
      if (waited >= OPPONENT_WAIT_TICKS) {
        let players = gsts.f.getListOfPlayerEntitiesOnTheField()
        if (players.length == 1) {
          let winnerFaction = gsts.f.queryEntityFaction(players[0])
          if (winnerFaction == factionRed) {
            gstsServerSettleGame(true)
          } else {
            gstsServerSettleGame(false)
          }
        }
      }
    }
  }
}

export function gstsServerRefreshBothJoined() {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let stage = getServerStageEntity()
  if (players.length > 1) {
    if (!stage.get('bothJoined').asType('bool')) {
      stage.set('bothJoined', true)
    }
  }
}

/**
 * 检测是否有玩家中途退出：在场玩家由 2 减为 1 时，剩余一方判胜并结算。
 *
 * 引擎没有「玩家离开对局」事件，但玩家退出会「移除」其玩家实体，故须由 stage 实体上的
 * 「实体移除/销毁时」(whenEntityIsRemovedDestroyed) 触发本函数（该事件对任意实体的
 * 移除/销毁均触发，包括棋子出界销毁，所以这里靠在场玩家数判定；重复结算由
 * gstsServerSettleGame 内的 settled 保护拦截）。
 */
export function gstsServerSettleIfPlayerLeft() {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let stage = getServerStageEntity()
  // 记录本局是否曾满员(2人)：单人试玩人数恒为1，且本事件对任意实体销毁(含吃子)都触发，
  // 必须「曾经2人、现在1人」才算有人离场，否则会在开局/吃子时误判结算。
  if (players.length > 1) {
    if (!stage.get('bothJoined').asType('bool')) {
      stage.set('bothJoined', true)
    }
  }
  if (players.length == 1) {
    if (stage.get('bothJoined').asType('bool')) {
      let winnerFaction = gsts.f.queryEntityFaction(players[0])
      if (winnerFaction == factionRed) {
        gstsServerSettleGame(true)
      } else {
        gstsServerSettleGame(false)
      }
    }
  }
}
