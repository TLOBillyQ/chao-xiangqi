import { g } from 'genshin-ts/runtime/core'

import { EntityTag } from '../../contracts/editorIds'
import { PieceVar } from '../../contracts/variables'
import { Signal } from '../../resources/signals'
import { gstsServerCreateDirectionIndicators } from '../../systems/piece/directionMarkers'
import { gstsServerCanControl } from '../../systems/turn/turnState'

g.server({
  id: 1073741852,
  name: 'getCurrentPiece'
}).onSignal(Signal.GetPiece, (_evt, f) => {
  //手动替换
  let targetEntity = self.get(PieceVar.scanEntity).asType('entity')

  let entity = _evt.signalSourceEntity.getPlayerEntityToWhichTheCharacterBelongs()
  if (entity == self) {
    if (gstsServerCanControl() == 1) {
      let enteringTag = f.getEntityUnitTagList(targetEntity)[0]
      //筛选到棋子
      if (enteringTag == EntityTag.Piece) gstsServerCreateDirectionIndicators(targetEntity, self)
      //方向标签
      //else if (enteringTag == EntityTag.Dir) gstsServerConfirmAndMovePiece(targetEntity)
    }
  }
})
