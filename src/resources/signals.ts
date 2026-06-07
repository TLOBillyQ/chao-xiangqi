// @gsts:signals

import { defineSignal } from 'genshin-ts/runtime/core'

export const Signal = {
  BeginCharge: defineSignal('BeginCharge', []),
  chgPlayerStage: defineSignal('chgPlayerStage', []),
  ControlUI: defineSignal('ControlUI', []),
  ExitGame: defineSignal('ExitGame', []),
  GetQiZi: defineSignal('GetQiZi', []),
  GH: defineSignal('GH', []),
  MoveForward: defineSignal('MoveForward', []),
  playerReady: defineSignal('playerReady', []),
  ResetCharge: defineSignal('ResetCharge', []),
  showLike: defineSignal('showLike', []),
  StopCharge: defineSignal('StopCharge', [])
} as const
