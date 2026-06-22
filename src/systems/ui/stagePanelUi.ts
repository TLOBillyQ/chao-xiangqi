import { SettlementStatus, UIControlGroupStatus } from 'genshin-ts/definitions/enum'

import * as UIControl from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'
import { PlayerVar, StageVar } from '../../contracts/variables'

/**
 * StagePanel(1073741847) 同 ID 接管的玩法逻辑。
 *
 * 原 `_GSTS_StagePanel` 挂玩家实体，监听界面控件组触发 + 三个客户端信号(showLike/chgPlayerStage/ExitGame)。
 * 这里忠实重写其行为；原图里 `__gsts_timeout_*` 计时器池只是 setTimeout 的编译产物，直接用 setTimeout。
 * 入口注册见 `src/nodes/ui/StagePanelGraph.ts`。
 */

type PlayerEntity = typeof self
const opponentExitSettlementMessage = '你的对手离开了游戏,你现在可以进行结算退出游戏'

/** 准备切换：玩家状态 1(已准备) ↔ 3(取消/闲逛)，连带「未准备」标记。调用方随后发 playerReady 信号。 */
export function gstsServerToggleReady(playerEntity: PlayerEntity) {
  if (playerEntity.get(PlayerVar.playerStage).asType('float') == 1) {
    playerEntity.set(PlayerVar.playerStage, 3)
    playerEntity.set(PlayerVar.notReady, true)
  } else {
    playerEntity.set(PlayerVar.playerStage, 1)
    playerEntity.set(PlayerVar.notReady, false)
  }
}

/** 查看规则：玩家状态=2，并打开规则悬浮交互页（接管前由编辑器图打开，现归本图）。 */
export function gstsServerViewRules(playerEntity: PlayerEntity) {
  playerEntity.set(PlayerVar.playerStage, 2)
  playerEntity.showFloatingInteractionPage(
    UIControl.ui_rulePage,
    dict([{ k: UIControl.ui_rulePageList, v: list('int', [1, 2]) }])
  )
}

/** 收到 chgPlayerStage：据对方玩家状态刷新本方「对方玩家状态」文案。sender = 信号来源(对方)。 */
export function gstsServerSetOpponentStageFromSignal(
  playerEntity: PlayerEntity,
  sender: PlayerEntity
) {
  if (sender != playerEntity) {
    let stageValue = sender.get(PlayerVar.playerStage).asType('float')
    if (stageValue == 1) {
      playerEntity.set(PlayerVar.opponentStage, UIControl.str_playerIsReady)
    } else if (stageValue == 2) {
      playerEntity.set(PlayerVar.opponentStage, UIControl.str_playerLookRule)
    } else if (stageValue == 3) {
      let idx = gsts.f.getRandomInteger(0, UIControl.str_playerWait.length - 1)
      playerEntity.set(
        PlayerVar.opponentStage,
        gsts.f.getCorrespondingValueFromList(UIControl.str_playerWait, idx)
      )
    }
  }
}

/** 收到对方 ExitGame：本方「对方玩家状态」置为「对方已退出游戏」。 */
export function gstsServerSetOpponentExited(playerEntity: PlayerEntity, sender: PlayerEntity) {
  if (sender != playerEntity) {
    playerEntity.set(PlayerVar.opponentStage, UIControl.str_opponentExited)
  }
}

/** 收到对方 showLike：随机播一个点赞动效并定时收起。sender = 点赞来源。 */
export function gstsServerShowLikeFromSignal(playerEntity: PlayerEntity, sender: PlayerEntity) {
  if (sender != playerEntity) {
    let idx = gsts.f.getRandomInteger(0, UIControl.likeAnimControls.length - 1)
    let ctrl = gsts.f.getCorrespondingValueFromList(UIControl.likeAnimControls, idx)
    playerEntity.setUiControlStatus(ctrl, UIControlGroupStatus.On)
    setTimeout((_e) => {
      playerEntity.setUiControlStatus(ctrl, UIControlGroupStatus.Off)
    }, 2000)
  }
}

/**
 * 单玩家对手离场结算提示初始化：中性系统播报 + 加分 + 亮结算按钮 + 定时收起。
 * 调用方必须先过本次对手离场事件的 guard，避免重复加分或重复初始化 UI。
 */
export function gstsServerApplyOpponentExitSettlementPrompt(playerEntity: PlayerEntity) {
  //中性系统播报（敌/我标签都关）
  playerEntity.setUiControlStatus(UIControl.ui_broadcastRoot, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.ui_broadcastText, UIControlGroupStatus.On)
  playerEntity.setUiControlStatus(UIControl.ui_broadcastEnemy, UIControlGroupStatus.Off)
  playerEntity.setUiControlStatus(UIControl.ui_broadcastMine, UIControlGroupStatus.Off)
  playerEntity.playUiAnimationOnControl(UIControl.ui_broadcastFxFull)
  getServerStageEntity().set(StageVar.errorMsg, opponentExitSettlementMessage)
  //对手离场奖励 +5：CurScore 累加，并以「未定」状态(原图 4100=SettlementStatus_TBC，非胜利)写排位分
  let newScore = playerEntity.get(PlayerVar.curScore).asType('int') + 5n
  playerEntity.set(PlayerVar.curScore, newScore)
  playerEntity.setPlayerRankScoreChange(SettlementStatus.Undefined, newScore)
  //亮结算按钮
  playerEntity.setUiControlStatus(UIControl.btn_settle, UIControlGroupStatus.On)
  //定时收起播报
  setTimeout((_e) => {
    playerEntity.setUiControlStatus(UIControl.ui_broadcastRoot, UIControlGroupStatus.Off)
  }, 3000)
}

/**
 * 官方对手离场结算提示行为。
 *
 * 模拟退出按钮和后续真实退出检测都应调用本入口，不再各自维护播报/加分/结算按钮分支。
 * guard 挂关卡实体，确保同一次对手离场提示最多初始化一次；回到准备时由 matchLifecycle 清除。
 */
export function gstsServerPromptOpponentExitSettlement() {
  let stage = getServerStageEntity()
  if (stage.get(StageVar.opponentExitPromptHandled).asType('bool') == false) {
    let players = gsts.f.getListOfPlayerEntitiesOnTheField()
    for (let i = 0; i < players.length; i++) {
      gstsServerApplyOpponentExitSettlementPrompt(players[i] as PlayerEntity)
    }
    stage.set(StageVar.opponentExitPromptHandled, true)
  }
}
