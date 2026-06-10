import { PlayerEntity } from 'genshin-ts/definitions/nodes'
import { g } from 'genshin-ts/runtime/core'
import type { entity } from 'genshin-ts/runtime/value'

import { gstsServerCanControl } from '../../ChangeControl'
import {
  dirPrefabs,
  EntityTag,
  factionBlack,
  factionRed,
  gstsServerBlackPieceDirections,
  gstsServerRedPieceDirections,
  Wall
} from '../../Global'
import { Signal } from '../../resources/signals'
import { gstsServerVec3ToVec2 } from '../../Tool'
import {
  gstsServerActivateDirectionUI,
  gstsServerActivateSwitchUI
} from '../../UIControl/ControlUIFunc'

g.server({
  id: 1073741852,
  name: 'getCurrentPiece'
}).onSignal(Signal.GetPiece, (_evt, f) => {
  //手动替换
  let targetEntity = self.get('ScanEntity').asType('entity')

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

//创建方向控件 参数1 目标棋子实体 参数2 玩家实体
function gstsServerCreateDirectionIndicators(targetEntity: entity, controlEntity: PlayerEntity) {
  //先把旧的扫描指示销毁
  gstsServerDestroyOldDirectionMarkers()
  //屏蔽当前选中棋子的扫描

  let Faction = gsts.f.queryEntityFaction(targetEntity)
  let pieceKey = gsts.f.getCustomVariable(targetEntity, '棋子类型').asType('str')

  let pos = gsts.f.getEntityLocationAndRotation(targetEntity).location

  //方向以棋子当前朝向为准：字典是出生朝向下的基准，按 当前yaw-出生yaw 的差值整体旋转
  let curYaw = gsts.f.getEntityLocationAndRotation(targetEntity).rotate.y
  let initYaw = gsts.f.getCustomVariable(targetEntity, 'initYaw').asType('float')
  let deltaYaw = curYaw - initYaw
  print(str('DIR_DELTA_YAW'))
  print(str(deltaYaw))

  //先给一个默认值
  let dirList = list('vec3', [[0, 1, 0]])

  //不同阵营读取字典不同
  if (Faction == factionRed) {
    if (pos.x < Wall.center && pieceKey == '兵') {
      pieceKey = '兵过河'
    }
    dirList = gstsServerRedPieceDirections(pieceKey)
  }

  if (Faction == factionBlack) {
    if (pos.x > Wall.center && pieceKey == '兵') {
      pieceKey = '兵过河'
    }
    dirList = gstsServerBlackPieceDirections(pieceKey)
  }

  for (let i = 0; i < dirList.length; i++) {
    //逻辑系→世界系→绕Y旋转deltaYaw→转回逻辑系（世界系往返保证旋向与引擎yaw一致）
    let worldVec = gstsServerVec3ToVec2(dirList[i])
    let rotatedWorld = gsts.f._3dVectorRotation(gsts.f.create3dVector(0, deltaYaw, 0), worldVec)
    let dirVec = gsts.f.create3dVector(rotatedWorld.z, rotatedWorld.x * -1, 0)

    //y==0（正横向）显式给角，规避除零与负零语义（旋转节点往返可能把+0变-0，atan(x/-0)会差180°）
    let Deg = 0
    if (dirVec.y == 0) {
      Deg = 90
      if (dirVec.x < 0) Deg = -90
    } else {
      let rad = gsts.f.arctangentFunction(dirVec.x / dirVec.y)
      Deg = gsts.f.radiansToDegrees(rad)
      if (dirVec.y < 0) Deg += 180
    }

    let Normalization = gsts.f._3dVectorNormalization(dirVec)
    let _createPos = gsts.f.create3dVector(pos.x - Normalization.y, pos.y, pos.z + Normalization.x)
    let rotate = gsts.f.create3dVector(0, Deg, 0)

    let PrefabId = dirPrefabs.red
    if (Faction == factionBlack) {
      PrefabId = dirPrefabs.black
    }
    //新增玩家选中的棋子类型变量
    self.set('curChessType', pieceKey)
    self.set('curChooseChess', targetEntity)

    let e = gsts.f.createPrefab(PrefabId, pos, rotate, targetEntity, true, 1, [EntityTag.Dir])
    gsts.f.setCustomVariable(e, 'moveVec', Normalization)
    // eslint-disable-next-line no-undef
    gsts.f.setCustomVariable<'float'>(e, 'dirUIIndex', global.float(i))
  }

  //controlEntity.setUiControlStatus(1073741846n,UIControlGroupStatus.On)
  //控件管理
  //激活控件方向选择
  gstsServerActivateSwitchUI(controlEntity)
  //激活方向
  gstsServerActivateDirectionUI(controlEntity, pieceKey, Faction == factionRed)
}

//销毁旧的棋子扫描
export function gstsServerDestroyOldDirectionMarkers() {
  let tagPrefabListRed = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.red)
  if (tagPrefabListRed.length > 0) {
    let _motherEntity = gsts.f.getOwnerEntity(tagPrefabListRed[0])
  }
  while (tagPrefabListRed.length > 0) {
    gsts.f.destroyEntity(tagPrefabListRed[tagPrefabListRed.length - 1])
  }

  let tagPrefabListBlack = gsts.f.getEntitiesWithSpecifiedPrefabOnTheField(dirPrefabs.black)
  if (tagPrefabListBlack.length > 0) {
    let _motherEntity = gsts.f.getOwnerEntity(tagPrefabListBlack[0])
  }
  while (tagPrefabListBlack.length > 0) {
    gsts.f.destroyEntity(tagPrefabListBlack[tagPrefabListBlack.length - 1])
  }
}
