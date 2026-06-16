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
