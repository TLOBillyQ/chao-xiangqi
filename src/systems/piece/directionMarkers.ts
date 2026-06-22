import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import type { entity } from 'genshin-ts/runtime/value'

import { dirPrefabs, EntityTag, factionBlack, factionRed } from '../../contracts/editorIds'
import { DirectionVar, PieceVar, PlayerVar } from '../../contracts/variables'
import { gstsServerVec3ToVec2 } from '../../core/vector'
import { gstsServerActivateDirectionUI, gstsServerActivateSwitchUI } from '../ui/directionUi'
import {
  gstsServerBlackPieceDirections,
  gstsServerIsCrossedPawn,
  gstsServerRedPieceDirections
} from './directions'

// 创建方向指示。方向字典、过河兵升变、实体生成与 UI 激活是一组行为，caller 不再拼装这套流程。
export function gstsServerCreateDirectionIndicators(
  targetEntity: entity,
  controlEntity: PlayerEntity
) {
  gstsServerDestroyOldDirectionMarkers()

  let faction = gsts.f.queryEntityFaction(targetEntity)
  let pieceKey = gsts.f.getCustomVariable(targetEntity, PieceVar.pieceType).asType('str')
  let pos = gsts.f.getEntityLocationAndRotation(targetEntity).location

  //方向以棋子当前朝向为准：字典是出生朝向下的基准，按 当前yaw-出生yaw 的差值整体旋转。
  let curYaw = gsts.f.getEntityLocationAndRotation(targetEntity).rotate.y
  let initYaw = gsts.f.getCustomVariable(targetEntity, PieceVar.initYaw).asType('float')
  let deltaYaw = curYaw - initYaw

  let dirList = list('vec3', [[0, 1, 0]])
  if (gstsServerIsCrossedPawn(targetEntity)) {
    pieceKey = '兵过河'
  }
  if (faction == factionRed) {
    dirList = gstsServerRedPieceDirections(pieceKey)
  }
  if (faction == factionBlack) {
    dirList = gstsServerBlackPieceDirections(pieceKey)
  }

  for (let i = 0; i < dirList.length; i++) {
    //逻辑系→世界系→绕Y旋转deltaYaw→转回逻辑系（世界系往返保证旋向与引擎yaw一致）
    let worldVec = gstsServerVec3ToVec2(dirList[i])
    let rotatedWorld = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, deltaYaw, 0), worldVec)
    let dirVec = gsts.f.create3dVector(rotatedWorld.z, rotatedWorld.x * -1, 0)

    //y==0（正横向）显式给角，规避除零与负零语义。
    let deg = 0
    if (dirVec.y == 0) {
      deg = 90
      if (dirVec.x < 0) deg = -90
    } else {
      let rad = gsts.f.arctangentFunction(dirVec.x / dirVec.y)
      deg = gsts.f.radiansToDegrees(rad)
      if (dirVec.y < 0) deg += 180
    }

    let normalization = gsts.f._3dVectorNormalization(dirVec)
    let rotate = gsts.f.create3dVector(0, deg, 0)

    let prefab = dirPrefabs.red
    if (faction == factionBlack) {
      prefab = dirPrefabs.black
    }

    controlEntity.set(PlayerVar.curChessType, pieceKey)
    controlEntity.set(PlayerVar.curChooseChess, targetEntity)

    let marker = gsts.f.createPrefab(prefab, pos, rotate, targetEntity, true, 1, [EntityTag.Dir])
    gsts.f.setCustomVariable(marker, DirectionVar.moveVec, normalization)
    // eslint-disable-next-line no-undef
    gsts.f.setCustomVariable<'float'>(marker, DirectionVar.dirUIIndex, global.float(i))
  }

  gstsServerActivateSwitchUI(controlEntity)
  gstsServerActivateDirectionUI(controlEntity, pieceKey, faction == factionRed)
}

// 销毁场上的方向指示。用 for 循环遍历快照，避免依赖 destroyEntity 是否会缩短本地列表。
export function gstsServerDestroyOldDirectionMarkers() {
  let redMarkers = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red)
  for (let i = 0; i < redMarkers.length; i++) {
    gsts.f.destroyEntity(redMarkers[i])
  }

  let blackMarkers = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black)
  for (let i = 0; i < blackMarkers.length; i++) {
    gsts.f.destroyEntity(blackMarkers[i])
  }
}

/**
 * 找到当前选中方向(curDirIndex)对应的方向指示实体；未找到时返回 curPlayer 自身作为空哨兵。
 * StopCharge 发射与 landingPreview 落点预览共用同一 interface，避免重复扫描红/黑预制体。
 */
export function gstsServerResolveSelectedDir(curPlayer: entity): entity {
  let curDirIndex = curPlayer.get(PlayerVar.curDirIndex).asType('float')
  let result = curPlayer
  let redMarkers = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red)
  for (let i = 0; i < redMarkers.length; i++) {
    if (curDirIndex == redMarkers[i].get(DirectionVar.dirUIIndex).asType('float')) {
      result = redMarkers[i]
    }
  }
  let blackMarkers = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black)
  for (let i = 0; i < blackMarkers.length; i++) {
    if (curDirIndex == blackMarkers[i].get(DirectionVar.dirUIIndex).asType('float')) {
      result = blackMarkers[i]
    }
  }
  return result
}
