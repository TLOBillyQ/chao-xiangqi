import { g } from 'genshin-ts/runtime/core'
import type { entity } from 'genshin-ts/runtime/value'

import { GraphId } from '../../contracts/graphIds'
import { gstsServerHandleDestroyedPiece } from '../../systems/piece/chessDestroy'

g.server({
  id: GraphId.chessDestroy,
  name: 'chessDestroy'
}).on('whenEntityIsDestroyed', (_evt, f) => {
  let pieceType = f
    .queryCustomVariableSnapshot(_evt.customVariableComponentSnapshot, '棋子类型')
    .asType('str')
  gstsServerHandleDestroyedPiece(
    _evt.eventSourceEntity as entity,
    _evt.ownerEntity as entity,
    _evt.faction,
    pieceType
  )
})
