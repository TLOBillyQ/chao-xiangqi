import { SettlementStatus, UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import { factionRed, getServerStageEntity } from '../Global'
import { btn_settle, ui_losePanel, ui_winPanel } from '../UIControlGroupId'

/**
 * 满足结算条件 → 显示结算 UI（不立即结算）。
 * player(1)=红方，player(2)=黑方。
 *
 * 流程：满足条件时只弹出结算面板（赢家胜利面板、输家失败面板）并给两人显示「结算」按钮，
 * 真正的关卡结算延迟到玩家点击「结算」按钮（见 gstsServerConfirmSettle）。胜负结果存到 stage
 * 的 redWin 变量，供点击时读回。
 *
 * 用 stage 上的 settled 变量做一次性保护——所有结算入口（玩家退出 / 将帅被吃 / 未来的超时等）
 * 都走本函数，保证整局只弹一次结算 UI。settled / redWin 在 ChessInit 创建时初始化。
 *
 * 前置（编辑器侧）：界面控件组库内需有「胜利面板」(ui_winPanel)、「失败面板」(ui_losePanel)
 * 与「结算」交互按钮(btn_settle)三套控件，并已加入对应玩家的界面布局。
 *
 * @param redWin 红方是否获胜（false 则黑方胜）
 */
export function gstsServerSettleGame(redWin: boolean) {
  print(str('PROBE_SG_ENTER'))
  let stage = getServerStageEntity()
  if (!stage.get('settled').asType('bool')) {
    print(str('PROBE_SG_UNSETTLED'))
    stage.set('settled', true)
    stage.set('redWin', redWin)
    // 赢家显示胜利面板，输家显示失败面板
    if (redWin) {
      player(1).setUiControlStatus(ui_winPanel, UIControlGroupStatus.On)
      player(2).setUiControlStatus(ui_losePanel, UIControlGroupStatus.On)
    } else {
      player(2).setUiControlStatus(ui_winPanel, UIControlGroupStatus.On)
      player(1).setUiControlStatus(ui_losePanel, UIControlGroupStatus.On)
    }
    print(str('PROBE_SG_PANELS_OK'))
    // 两名玩家都显示「结算」按钮，点击后才真正结算
    player(1).setUiControlStatus(btn_settle, UIControlGroupStatus.On)
    player(2).setUiControlStatus(btn_settle, UIControlGroupStatus.On)
    print(str('PROBE_SG_DONE'))
  }
}

/**
 * 玩家点击「结算」按钮后真正结算整局（个人结算）：胜方判胜、败方判负，弹出关卡结算页。
 *
 * 由玩家节点图的「界面控件组触发时」事件在 uiControlGroupIndex == btn_settle 时调用。
 * 胜负从 stage 的 redWin 变量读回（在 gstsServerSettleGame 显示 UI 时已写入）。
 *
 * 前置（编辑器侧）：【关卡设置 - 结算】结算界面类型为「个人结算」；计分模板 / 排名展示
 * 需在结算页签内预先配置，否则仅结束对局而无展示数据。
 */
export function gstsServerConfirmSettle() {
  let stage = getServerStageEntity()
  let redWin = stage.get('redWin').asType('bool')
  if (redWin) {
    gsts.f.setPlayerSettlementSuccessStatus(player(1), SettlementStatus.Victory)
    gsts.f.setPlayerSettlementSuccessStatus(player(2), SettlementStatus.Defeat)
  } else {
    gsts.f.setPlayerSettlementSuccessStatus(player(2), SettlementStatus.Victory)
    gsts.f.setPlayerSettlementSuccessStatus(player(1), SettlementStatus.Defeat)
  }
  gsts.f.settleStage()
}

export function gstsServerRefreshBothJoined() {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let stage = getServerStageEntity()
  if (players.length > 1) {
    if (!stage.get('bothJoined').asType('bool')) {
      stage.set('bothJoined', true)
      print(str('PROBE_BOTH_JOINED'))
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
  print(str('PROBE_LEFT_CHECK'))
  print(str(players.length))
  // 记录本局是否曾满员(2人)：单人试玩人数恒为1，且本事件对任意实体销毁(含吃子)都触发，
  // 必须「曾经2人、现在1人」才算有人离场，否则会在开局/吃子时误判结算。
  if (players.length > 1) {
    if (!stage.get('bothJoined').asType('bool')) {
      stage.set('bothJoined', true)
      print(str('PROBE_BOTH_JOINED'))
    }
  }
  if (players.length == 1) {
    if (stage.get('bothJoined').asType('bool')) {
      print(str('PROBE_LEFT_FIRE'))
      let winnerFaction = gsts.f.queryEntityFaction(players[0])
      if (winnerFaction == factionRed) {
        gstsServerSettleGame(true)
      } else {
        gstsServerSettleGame(false)
      }
    }
  }
}
