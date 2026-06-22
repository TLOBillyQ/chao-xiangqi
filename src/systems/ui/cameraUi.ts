import { factionRed } from '../../contracts/editorIds'
import { PlayerVar } from '../../contracts/variables'

function gstsServerGetPlayerCameraEntity(playerEntity: typeof self) {
  // 对局镜头按玩家区分：玩家1(红)=镜头1(1077937005)，玩家2(黑)=镜头2(1077937034)，条目同名「垂直」「斜45」
  // 存「实体」而非 GUID：queryEntityByGuid 需 GUID 字面量，存 GUID 变量会被编成 int 局部量、IR 报 Invalid value type: guid
  let camEntity = gsts.f.queryEntityByGuid(1077937034n)
  if (gsts.f.queryEntityFaction(playerEntity) == factionRed) {
    camEntity = gsts.f.queryEntityByGuid(1077937005n)
  }

  return camEntity
}

export function gstsServerSwitchToVerticalCamera(playerEntity: typeof self) {
  // 点「准备」或「再来一局/重开」进入对局：默认切到垂直视角
  playerEntity.set(PlayerVar.isVerticalCam, true)
  let camEntity = gstsServerGetPlayerCameraEntity(playerEntity)
  gsts.f.setPlayerCameraToFollowEntity(playerEntity, camEntity, '垂直')
}

export function gstsServerToggleBattleCamera(playerEntity: typeof self) {
  // 「切换视角」：进行中在 垂直 / 斜45 间来回切（同一玩家镜头实体上的两个同名条目）
  let toVertical = !playerEntity.get(PlayerVar.isVerticalCam).asType('bool')
  playerEntity.set(PlayerVar.isVerticalCam, toVertical)
  let camEntity = gstsServerGetPlayerCameraEntity(playerEntity)
  if (toVertical) {
    gsts.f.setPlayerCameraToFollowEntity(playerEntity, camEntity, '垂直')
  } else {
    gsts.f.setPlayerCameraToFollowEntity(playerEntity, camEntity, '斜45')
  }
}
