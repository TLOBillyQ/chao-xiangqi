# Task 3: 编辑器棋子 trigger collider 半径验证

## 代码侧信息
- `Global.radius = 1.0`（用于冲量计算：`I = 0.5 * mass * radius^2`）
- 棋子大小表（策划案）：
  - 车: 1.03, 马: 1.08, 炮: 1.13, 相: 1.21, 士: 1.40
  - 兵/卒: 0.97, 帅/将: 1.30

## 分析
`Global.radius` 用于计算转动惯量，是物理半径的近似。
棋子的视觉大小（大小列）与物理碰撞 trigger collider 半径可能不同。

## 轨迹预测策略
TrajectoryUtils 使用常量 `PREDICTION_RADIUS = 1.0` 与 `Global.radius` 保持一致。
这确保预测的碰撞距离与实际台球冲量计算所用距离一致。

若实机 QA 发现预测线与实际碰撞有明显偏差（>0.5 个单位），
则在 Global.ts 中引入 `export const PREDICTION_RADIUS = X.X` 并在 TrajectoryUtils 中引用。

## 状态
⚠️ **基于假设** — 假设 trigger collider ≈ 1.0 radius
实机 QA 时需观察预测线终点与实际碰撞触发时机是否大致对齐
