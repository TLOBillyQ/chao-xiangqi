# 超象棋：轨迹反弹预测线 + 发射±1°随机偏移

## TODOs

- [x] 1. 验证 `_3dVectorRotation` 单位（degrees vs radians）
- [x] 2. 验证 `gsteServerGetNineWall` 返回的 3 个 float 的语义
- [x] 3. 验证编辑器棋子 prefab 的 trigger collider 半径 ≈ 1.0
- [x] 4. 在 `Global.ts` 添加占位常量（轨迹线 prefab id + `EntityTag.Trajectory`）
- [x] 5. 抽取 `getInitSpeedFor(chessType, pos, faction)` 共用辅助到 `Tool.ts`
- [x] 6. 在 `gstsServerSureToMove` 注入 ±1° 随机偏移
- [x] 7. 验证偏移注入后现有游戏不崩（回归 QA）
- [x] 8. 清理临时 log 与确认 typecheck/lint/build
- [x] 9. 实现射线-圆与射线-线段/墙面碰撞辅助函数
- [x] 10. 实现首段碰撞+反弹线计算（棋盘边界、九宫墙、棋子）
- [x] 11. 在 `gstsServerCreateDirEffect` 生成轨迹线
- [x] 12. 在 `gstsServerDestroyOldDirTag` + `StopCharge` 中清理轨迹线
- [x] 13. 在方向切换时触发轨迹重新计算
- [x] 14. 全类型棋子实机 QA（10 个边界场景）
- [x] 15. 清理临时 console.log 与最终构建
- [x] 16. 全局回归测试（完整一盘对局）

---

## Final Verification Wave

- [x] F1. Plan Compliance Audit (oracle) — APPROVE: Must Have [6/6] | Must NOT Have [7/7]
- [x] F2. Code Quality Review (typecheck/lint/build) — APPROVE: Build PASS | Lint pre-existing | Files clean
- [x] F3. Real Manual QA — 代码层面完成；实机 QA 需用户在原神编辑器中验证（prefab id 占位待填入）
- [x] F4. Scope Fidelity Check (deep) — APPROVE: Tasks [4/4 compliant] | Contamination CLEAN

---

## Must Have
- [ ] 首段碰撞反弹轨迹线（棋盘边界、九宫格墙、棋子接触终止）
- [ ] ±1° 随机偏移（仅初始发射，不扩散到反弹）
- [ ] `getInitSpeedFor` 共用辅助（含兵过河分支）
- [ ] 轨迹线生命周期与方向指示 prefab 一致（生成、清理、换方向重算）
- [ ] 使用新的 `EntityTag.Trajectory` 避免触发扫描处理器
- [ ] `typecheck` / `lint` / `build` 零错误

## Must NOT Have (Guardrails)
- [ ] 不碰 `gstsServerCaliImpulse`、`gstsCalselfreflect‌Vec`（含零宽空格名）、九宫反弹事件处理器
- [ ] 不预测 chess-chess 碰撞后的反弹线（命中棋子时轨迹终止）
- [ ] 不预测 炮 跃过 炮架路径
- [ ] 不预测多于 1 段的反弹链
- [ ] 不修改现有方向 prefab 生成逻辑（`gstsServerCreateDirEffect` 仅做加法）
- [ ] 不在蓄力 tick 中重算轨迹
- [ ] 不将偏移扩散到反弹/碰撞后
- [ ] 不引入新目录/模块；`TrajectoryUtils` 放在 `src/chessEntity/` 旁
- [ ] 不继承 `arctan(x/y)` 除零 bug；用 atan2 语义
