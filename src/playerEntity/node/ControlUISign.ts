import { UIControlGroupStatus } from 'genshin-ts/definitions/enum'
import { g } from 'genshin-ts/runtime/core'

import { EntityTag } from '../../Global'
import * as UIControl from '../../UIControlGroupId'

g.server({
  id: 1073741841,
  name: 'ControlUI'
}).onSignal('ControlUI', (_evt, f) => {
  //需要手动修改传入目标
  let targetentity = f.getSelfEntity()
  let enteringTag = f.getEntityUnitTagList(targetentity)[0]
  if (enteringTag == EntityTag.Dir) {
    self.setUiControlStatus(1073741840n, UIControlGroupStatus.On)
  } else {
    self.setUiControlStatus(1073741840n, UIControlGroupStatus.Off)
  }
})

g.server({
  id: 1073741844,
  name: 'changeDir'
}).on('whenUiControlGroupIsTriggered', (_evt, _f) => {
  let controlEntity = _evt.eventSourceEntity
  const curChooseChessType = controlEntity.get('curChessType').asType('str')
  let curDirIndex = controlEntity.get('curDirIndex').asType('float')

  let dirList = UIControl.dirContrlId.车
  if (curChooseChessType == '马') dirList = UIControl.dirContrlId.马
  else if (curChooseChessType === '炮') dirList = UIControl.dirContrlId.炮
  else if (curChooseChessType === '象') dirList = UIControl.dirContrlId.象
  else if (curChooseChessType === '士') dirList = UIControl.dirContrlId.士
  else if (curChooseChessType === '帅') dirList = UIControl.dirContrlId.帅
  else if (curChooseChessType === '兵') dirList = UIControl.dirContrlId.兵
  else if (curChooseChessType === '兵过河') dirList = UIControl.dirContrlId.兵过河

  let newIndex = curDirIndex
  controlEntity.setUiControlStatus(dirList[idx(int(curDirIndex))], UIControlGroupStatus.Off)
  if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.left) {
    newIndex = curDirIndex - 1
    let length = Number(dirList.length)
    if (newIndex < 0) newIndex = length - 1
  } else if (_evt.uiControlGroupCompositeIndex == UIControl.changeDir.right) {
    newIndex = curDirIndex + 1
    let length = Number(dirList.length)
    if (newIndex > length - 1) newIndex = 0
  }

  controlEntity.set('curDirIndex', newIndex)
  controlEntity.setUiControlStatus(dirList[idx(int(newIndex))], UIControlGroupStatus.On)
})
