import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { entity, faction } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed, ui_outOfBoundsPanel } from '../../contracts/editorIds'
import { getServerStageEntity } from '../../contracts/stage'
import { gstsServerSettleGame } from '../settlement/settlement'
import { gstsServerErrorMsg } from '../ui/broadcastUi'

export function gstsServerHandleDestroyedPiece(
  destroyedEntity: entity,
  ownerEntity: entity,
  pieceFaction: faction,
  pieceType: string
) {
  let stage = getServerStageEntity()
  let gameStage = stage.get('GameStage').asType('float')

  //历史 chessDestroy 只在对局中处理棋子销毁；GameStage=3 的旧重置分支已不再恢复。
  if (gameStage == 2) {
    if (pieceType != '') {
      gstsServerRemoveDestroyedPieceFromMoveList(destroyedEntity)

      let remaining = ownerEntity.get('剩余棋子').asType('int') - 1n
      if (remaining < 0n) {
        remaining = 0n
      }
      ownerEntity.set('剩余棋子', remaining)
      gstsServerShowOutOfBoundsBroadcast(pieceFaction)

      if (pieceType == '帅' || pieceType == '将') {
        if (pieceFaction == factionRed) {
          gstsServerSettleGame(false)
        } else {
          gstsServerSettleGame(true)
        }
      }
    }
  }
}

function gstsServerRemoveDestroyedPieceFromMoveList(destroyedEntity: entity) {
  let stage = getServerStageEntity()
  let moveList = stage.get('moveList').asType('entity_list')
  for (let i = 0; i < moveList.length; i++) {
    if (moveList[i] == destroyedEntity) {
      gsts.f.removeValueFromList(moveList, i)
      stage.set('moveList', moveList)
      break
    }
  }
}

function gstsServerShowOutOfBoundsBroadcast(pieceFaction: faction) {
  let msg = '黑方棋子出界'
  if (pieceFaction == factionRed) {
    msg = '红方棋子出界'
  } else if (pieceFaction == factionBlack) {
    msg = '黑方棋子出界'
  }

  let players = gsts.f.getListOfPlayerEntitiesOnTheField()
  for (let i = 0; i < players.length; i++) {
    let p = players[i]
    p.setUiControlStatus(ui_outOfBoundsPanel, UIControlGroupStatus.On)
    gstsServerErrorMsg(msg, p as entity, gsts.f.queryEntityFaction(p) == pieceFaction)
  }

  setTimeout((_evt) => {
    let livePlayers = gsts.f.getListOfPlayerEntitiesOnTheField()
    for (let i = 0; i < livePlayers.length; i++) {
      livePlayers[i].setUiControlStatus(ui_outOfBoundsPanel, UIControlGroupStatus.Off)
    }
  }, 3000)
}
