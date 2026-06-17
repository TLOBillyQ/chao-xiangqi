import { SettlementStatus, UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity } from 'genshin-ts/runtime/value'

import {
  btn_exitGame,
  btn_showLike,
  str_playerIsReady,
  str_playerLookRule,
  str_playerWait,
  ui_broadcastEnemy,
  ui_broadcastFxFull,
  ui_broadcastMine,
  ui_broadcastRoot,
  ui_broadcastText
} from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'
import { gstsServerConfirmSettle } from '../settlement/settlement'
import { gstsServerHideTitleForRulePage } from './rulePageUi'

const PlayerState = {
  ready: 1,
  viewingRules: 2,
  notReady: 3
} as const

const OpponentLeftText = '你的对手离开了游戏,你现在可以进行结算退出游戏'
const OpponentExitedText = '对方已退出游戏'

export function gstsServerToggleReadyState(playerEntity: entity) {
  let state = playerEntity.get('玩家状态').asType('float')
  if (state == PlayerState.ready) {
    playerEntity.set('玩家状态', PlayerState.notReady)
    playerEntity.set('未准备', true)
  } else {
    playerEntity.set('玩家状态', PlayerState.ready)
    playerEntity.set('未准备', false)
  }
}

export function gstsServerMarkViewingRules(playerEntity: entity, hideTitle: boolean) {
  playerEntity.set('玩家状态', PlayerState.viewingRules)
  if (hideTitle) {
    gstsServerHideTitleForRulePage(playerEntity)
  }
}

export function gstsServerMarkNotReadyAfterRulePage(playerEntity: entity) {
  if (playerEntity.get('玩家状态').asType('float') == PlayerState.viewingRules) {
    playerEntity.set('玩家状态', PlayerState.notReady)
    playerEntity.set('未准备', true)
  }
}

export function gstsServerSyncOpponentStageState(signalSourceEntity: entity) {
  if (signalSourceEntity != self) {
    let state = signalSourceEntity.get('玩家状态').asType('float')
    if (state == PlayerState.ready) {
      self.set('对方玩家状态', str_playerIsReady)
    } else if (state == PlayerState.viewingRules) {
      self.set('对方玩家状态', str_playerLookRule)
    } else if (state == PlayerState.notReady) {
      let waitIndex = gsts.f.getRandomInteger(0, 3)
      if (waitIndex == 0n) {
        self.set('对方玩家状态', str_playerWait[0])
      } else if (waitIndex == 1n) {
        self.set('对方玩家状态', str_playerWait[1])
      } else if (waitIndex == 2n) {
        self.set('对方玩家状态', str_playerWait[2])
      } else {
        self.set('对方玩家状态', str_playerWait[3])
      }
    }
  }
}

export function gstsServerMarkOpponentExitFromSignal(signalSourceEntity: entity) {
  if (signalSourceEntity != self) {
    self.set('对方玩家状态', OpponentExitedText)
  }
}

export function gstsServerShowOpponentLeftPrompt(signalSourceEntity: entity) {
  if (signalSourceEntity != self) {
    self.setUiControlStatus(btn_exitGame, UIControlGroupStatus.On)
    self.setUiControlStatus(btn_showLike, UIControlGroupStatus.On)
    self.setUiControlStatus(ui_broadcastRoot, UIControlGroupStatus.On)
    self.setUiControlStatus(ui_broadcastText, UIControlGroupStatus.On)
    self.setUiControlStatus(ui_broadcastEnemy, UIControlGroupStatus.On)
    self.setUiControlStatus(ui_broadcastMine, UIControlGroupStatus.Off)
    self.playUiAnimationOnControl(ui_broadcastFxFull)
    getServerStageEntity().set('ErrorMsg', OpponentLeftText)
  }
}

export function gstsServerAddLikeScore(signalSourceEntity: entity) {
  if (signalSourceEntity != self) {
    let score = self.get('CurScore').asType('int') + 5n
    self.set('CurScore', score)
    gsts.f.setPlayerRankScoreChange(self, SettlementStatus.Victory, score)
  }
}

export function gstsServerConfirmSettleFromLegacyExit() {
  let stage = getServerStageEntity()
  if (stage.get('settled').asType('bool')) {
    gstsServerConfirmSettle()
  }
}
