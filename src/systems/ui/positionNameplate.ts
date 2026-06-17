import { factionBlack, factionRed } from '../../contracts/editorIds'

/**
 * 把单个玩家的昵称写进其阵营对应的「玩家位置」底座物件的自定义变量「玩家昵称」，
 * 供该物件铭牌文本框以富文本 {1:s.玩家昵称} 实时引用显示。
 *
 * 在玩家进场（playerCreate 的 whenEntityIsCreated）时单次调用即可——玩家实体创建时
 * 其阵营已随出生槽位确定，无需每 tick 重写，避免持续的变量同步开销。
 *
 * 红方玩家 → 红位物件（摆放实例 GUID 1077937032），黑方玩家 → 黑位物件（1077937033）。
 * GUID 取自 .gil 摆放表（与镜头 1077936985 / 玩家镜头 1077937005 同区段交叉验证）。
 * 注意：queryEntityByGuid 必须传 GUID 字面量，存成变量会被编成 int 局部量、IR 报
 * Invalid value type: guid（见 cameraUi.ts），故此处内联 1077937032n / 1077937033n。
 *
 * 铭牌「我方/敌方」前缀由编辑器侧本地过滤器按客户端阵营决定，代码只负责昵称；
 * 不做字符串拼接（规避 graph 作用域拼接编译坑），仅写入原始昵称字符串。
 */
export function gstsServerLabelPlayerPosition(playerEntity: typeof self) {
  let f = gsts.f.queryEntityFaction(playerEntity)
  let nick = gsts.f.getPlayerNickname(playerEntity)
  if (f == factionRed) {
    let redPos = gsts.f.queryEntityByGuid(1077937032n)
    redPos.set('玩家昵称', nick)
  } else if (f == factionBlack) {
    let blackPos = gsts.f.queryEntityByGuid(1077937033n)
    blackPos.set('玩家昵称', nick)
  }
}
