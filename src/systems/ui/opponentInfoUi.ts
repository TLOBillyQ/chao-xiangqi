import { entity } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed } from '../../contracts/editorIds'

/**
 * 双方都在场时按阵营互写对方昵称（红方变量存黑方昵称、黑方变量存红方昵称）。
 *
 * 供 UI 控件（如 1073742473）绑定玩家变量「对方玩家昵称」显示。玩家创建时对方常未进场，
 * 故由 gstsServerRefreshBothJoined 在「双方满员」翻转那一刻单次调用，避免每 tick 重复写。
 * 昵称取自 gsts.f.getPlayerNickname；用阵营匹配而非实体相等，与 turnState 写法保持一致。
 */
export function gstsServerSyncOpponentNicknames() {
  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  let redPlayer = player(1) as entity
  let blackPlayer = player(2) as entity
  let hasRed = false
  let hasBlack = false
  for (let i = 0; i < players.length; i++) {
    if (gsts.f.queryEntityFaction(players[i]) == factionRed) {
      redPlayer = players[i] as entity
      hasRed = true
    } else if (gsts.f.queryEntityFaction(players[i]) == factionBlack) {
      blackPlayer = players[i] as entity
      hasBlack = true
    }
  }
  if (hasRed && hasBlack) {
    redPlayer.set('对方玩家昵称', gsts.f.getPlayerNickname(blackPlayer))
    blackPlayer.set('对方玩家昵称', gsts.f.getPlayerNickname(redPlayer))
  }
}
