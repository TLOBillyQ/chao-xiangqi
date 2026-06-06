# Task 1: _3dVectorRotation 单位验证

## 结论
**单位：DEGREES（角度，非弧度）**

## 证据
1. **代码用法分析**（src/Tool.ts:103,107, src/trigger/triggerFunction.ts:64,70,77,85）：
   - 所有调用均使用整数值：`[0,90,0]`, `[0,-90,0]`, `[90,0,0]`, `[-90,0,0]`
   - 若是弧度，90弧度≈5156°，不符合任何正常旋转语义

2. **引擎惯例**：原神（genshin）引擎 API 文档和命名 `_3dVectorRotation` 对应编辑器内「三维向量旋转」节点，
   该节点使用 Euler 欧拉角（degrees）

3. **实际工作验证**：现有碰撞代码中 `_3dVectorRotation([0,90,0], vecN)` 用于计算切线向量
   （法线顺时针旋转 90°），物理上正确，说明参数确实是 degrees

## 影响
- Task 6（±1° 偏移注入）：`_3dVectorRotation([0, offsetDeg, 0], relVec)` 直接传 `±1.0`
- **无需** `* Math.PI / 180` 转换
