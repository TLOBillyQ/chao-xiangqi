export const GraphId = {
  triggerCollision: 1073741827,
  playerCreate: 1073741828,
  triggerTimers: 1073741833,
  chessInit: 1073741842,
  chessInitNode: 1073741834,
  chessWallCollision: 1073741835,
  chargeChangeTick: 1073741836,
  resetCharge: 1073741837,
  stopCharge: 1073741838,
  beginCharge: 1073741839,
  controlUiSignal: 1073741841,
  playerTimers: 1073741843,
  playerUiControls: 1073741844,
  playerActive: 1073741852
} as const

export const GraphName = {
  controlUi: 'ControlUI',
  changeDir: 'changeDir',
  rulePageInteraction: 'rulePageInteraction',
  chargeSkillInput: 'chargeSkillInput',
  stopCharge: 'StopCharge'
} as const
