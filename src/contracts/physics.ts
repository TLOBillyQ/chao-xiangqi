export const radius = 1.0
export const e = 0.93 //碰撞恢复系数
export const deltaT = 0.03

//碰撞分离阈值：两子中心距超过此值即视为脱离接触，可重新触发下一次碰撞。
//= 两倍半径（两子表面刚好分开）。碰撞去重据此重整，避免「停下才清」造成的残留条目。
export const contactSeparation = radius * 2

//运动阻尼
export const deltaMove = 4.0
//运动阻尼
export const deltaMoveTriggerBefore = 2.0

//落点预计距离校准系数（实测后调整：实际距离/预计距离）
export const landingCalibration = 1.0

//兵过河后的提升初速：选子方向、发射初速、落点预览三处共用 gstsServerEffectiveInitSpeed 读取
export const crossedPawnInitSpeed = 25

//炮首次主动碰撞的加速倍率（现速 × 该值，且不低于基础初速）
export const cannonLaunchBoost = 1.2
