import type { entity } from 'genshin-ts/runtime/value'

import { factionBlack, factionRed } from '../../contracts/editorIds'
import { crossedPawnInitSpeed } from '../../contracts/physics'
import { Wall } from '../../contracts/stage'
import { PieceVar } from '../../contracts/variables'

export function gstsServerRedPieceDirections(chessType: string) {
  const redPieceDirections = dict({
    车: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    马: list('vec3', [
      [-1, 2, 0],
      [1, 2, 0],
      [2, 1, 0],
      [2, -1, 0],
      [1, -2, 0],
      [-1, -2, 0],
      [-2, -1, 0],
      [-2, 1, 0]
    ]),
    象: list('vec3', [
      [-2, 2, 0],
      [2, 2, 0],
      [2, -2, 0],
      [-2, -2, 0]
    ]),
    士: list('vec3', [
      [-1, 1, 0],
      [1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0]
    ]),
    帅: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    炮: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0]
    ]),
    兵: list('vec3', [[0, 1, 0]]),
    兵过河: list('vec3', [
      [0, 1, 0],
      [1, 0, 0],
      [-1, 0, 0]
    ])
  })

  const diclist = redPieceDirections.get(chessType)

  return diclist
}

export function gstsServerBlackPieceDirections(chessType: string) {
  const blackPieceDirections = dict({
    车: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    马: list('vec3', [
      [1, -2, 0],
      [-1, -2, 0],
      [-2, -1, 0],
      [-2, 1, 0],
      [-1, 2, 0],
      [1, 2, 0],
      [2, 1, 0],
      [2, -1, 0]
    ]),
    象: list('vec3', [
      [2, -2, 0],
      [-2, -2, 0],
      [-2, 2, 0],
      [2, 2, 0]
    ]),
    士: list('vec3', [
      [1, -1, 0],
      [-1, -1, 0],
      [-1, 1, 0],
      [1, 1, 0]
    ]),
    帅: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    炮: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [1, 0, 0]
    ]),
    兵: list('vec3', [[0, -1, 0]]),
    兵过河: list('vec3', [
      [0, -1, 0],
      [-1, 0, 0],
      [1, 0, 0]
    ])
  })
  return blackPieceDirections.get(chessType)
}

/**
 * 兵是否已过河：红方过中线(pos.x<Wall.center)、黑方过中线(pos.x>Wall.center)的「兵」。
 * 选子方向、发射初速、落点预览三处共用同一判定，避免红黑镜像规则在多个 caller 漂移。
 */
export function gstsServerIsCrossedPawn(piece: entity): boolean {
  let pieceType = piece.get(PieceVar.pieceType).asType('str')
  let faction = piece.faction()
  let pos = piece.pos
  let crossed = false
  if (faction == factionRed) {
    if (pos.x < Wall.center && pieceType == '兵') crossed = true
  }
  if (faction == factionBlack) {
    if (pos.x > Wall.center && pieceType == '兵') crossed = true
  }
  return crossed
}

/**
 * 有效初速：兵过河后提升为 crossedPawnInitSpeed，其余返回棋子基础 initSpeed。
 * 发射与落点预览共用本函数，保证预测落点与实际落点一致。
 */
export function gstsServerEffectiveInitSpeed(piece: entity): number {
  let initSpeed = piece.get(PieceVar.initSpeed).asType('float')
  if (gstsServerIsCrossedPawn(piece)) {
    initSpeed = crossedPawnInitSpeed
  }
  return initSpeed
}
