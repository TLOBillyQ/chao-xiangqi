## <font style="color:rgb(35, 45, 54);">一、 游戏概述</font>
+ **<font style="color:rgb(35, 45, 54);">游戏核心：</font>**<font style="color:rgb(35, 45, 54);"> </font><font style="color:rgb(35, 45, 54);">基于中国象棋规则的“回合制物理弹射碰撞”双人对战游戏。</font>
+ **<font style="color:rgb(35, 45, 54);">核心玩法：</font>**<font style="color:rgb(35, 45, 54);"> 玩家轮流操作己方棋子，在参照原版棋子的移动规则下，通过“选择方向”“按住蓄力”沿特定方向发射棋子，利用台球式的物理碰撞，将敌方棋子撞落棋盘。</font>
+ **<font style="color:rgb(35, 45, 54);">胜利条件：</font>**<font style="color:rgb(35, 45, 54);"> 将敌方的“帅/将”撞出棋盘边缘，坠落深渊即为胜利。</font>

---

## <font style="color:rgb(35, 45, 54);">二、 核心机制设计</font>
### <font style="color:rgb(35, 45, 54);">1. 物理与场地系统</font>
+ **<font style="color:rgb(35, 45, 54);">无边界悬浮棋盘：</font>**<font style="color:rgb(35, 45, 54);"> 棋盘是一个表面光滑的平面平台，四周没有护栏，每一格大于棋子一点（每个棋子之间有细微空隙）。</font>
+ **<font style="color:rgb(35, 45, 54);">质量与摩擦力：</font>**<font style="color:rgb(35, 45, 54);"> </font><font style="color:rgb(35, 45, 54);">不同的棋子有不同的“质量（Mass）”。例如：车速度快但质量中等；将/帅质量极大，极难被撞飞；兵/卒质量小，容易被撞飞。</font>
+ **<font style="color:rgb(35, 45, 54);">弹射偏移：</font>**<font style="color:rgb(35, 45, 54);">棋子只能沿着基于自身的原本可用方向，如车的话会只能沿着自身前方后方左方右方移动。每次发射会在直线防线正负1度的角度随机偏移，产生用手指弹的感觉</font>
+ **<font style="color:rgb(35, 45, 54);">动量传递（台球效应）：</font>**<font style="color:rgb(35, 45, 54);"> 棋子相撞时，动能会传递，棋子会沿着切线旋转。玩家可以通过提前布局以及“连环撞”（用自己的车撞自己的炮，炮再去撞敌方的将）来达成战术目的。</font>
+ **<font style="color:rgb(35, 45, 54);">坠落死亡：</font>**<font style="color:rgb(35, 45, 54);"> 任何棋子（无论敌我），一旦超出棋盘边缘掉落，即视为死亡，从本局中移除。</font>**<font style="color:rgb(35, 45, 54);">（注：蓄力过猛导致自己冲下棋盘也会死亡，无论是自己掉出去的还是被撞出去的）。</font>**
+ **<font style="color:rgb(35, 45, 54);">棋子大小：</font>**<font style="color:rgb(35, 45, 54);">不同质量的棋子大小也不同</font>

### <font style="color:rgb(35, 45, 54);">2. 边界限制保留</font>
<font style="color:rgb(35, 45, 54);">传统象棋有“将不出宫”、“相不过河”的规则。在物理碰撞的规则下，本游戏采用**“主动发力限制 + 被动碰撞无视”**的设计：</font>

+ **<font style="color:rgb(35, 45, 54);">主动移动限制：</font>**<font style="color:rgb(35, 45, 54);"> 玩家操控的话，无法让相，士，帅走出原本的可移动范围，如果碰到可移动范围边界的话即会被反弹，但是碰到底边则不会反弹（以自身为视角往下的那一个边）</font>
+ **<font style="color:rgb(35, 45, 54);">被动碰撞无视：</font>**<font style="color:rgb(35, 45, 54);"> </font><font style="color:rgb(35, 45, 54);">当棋子是被</font>**<font style="color:rgb(35, 45, 54);">其他棋子（无论敌我）撞击</font>**<font style="color:rgb(35, 45, 54);">时，这面空气墙</font>**<font style="color:rgb(35, 45, 54);">失效</font>**<font style="color:rgb(35, 45, 54);">！</font>
    - _<font style="color:rgb(35, 45, 54);">举例：老将无法自己弹射出九宫格，但如果你用己方的车以极高的速度撞击老将，老将完全可以被撞飞出九宫格，甚至直接被敌方撞掉下悬崖。如果棋子被撞出去之后则无法再主动移动。直到对方或者我方用其他棋子把这个棋子撞回可移动范围为止</font>_

---

## <font style="color:rgb(35, 45, 54);">三、 棋子弹射规则与特性设计</font>
<font style="color:rgb(35, 45, 54);">每个棋子在轮到自己回合时，只能在传统规则允许的**“方向”**上进行拖拽蓄力。</font>

| **<font style="color:rgb(35, 45, 54);">棋子类型</font>** | **<font style="color:rgb(35, 45, 54);">弹射方向限制</font>** | **<font style="color:rgb(35, 45, 54);">物理特性与特殊技能设定</font>** | **<font style="color:rgb(35, 45, 54);">大小</font>** | **<font style="color:rgb(35, 45, 54);">质量</font>** |
| --- | --- | --- | --- | --- |
| **<font style="color:rgb(35, 45, 54);">车 </font>** | <font style="color:rgb(35, 45, 54);">十字方向（上、下、左、右）</font> | <font style="color:rgb(35, 45, 54);">无特别规则</font> | **<font style="color:rgb(35, 45, 54);">1.03</font>** | **<font style="color:rgb(35, 45, 54);">10</font>** |
| **<font style="color:rgb(35, 45, 54);">马 </font>** | <font style="color:rgb(35, 45, 54);">八个“日”字对角线方向</font> | <font style="color:rgb(35, 45, 54);">同车的力度</font> | **<font style="color:rgb(35, 45, 54);">1.08</font>** | **<font style="color:rgb(35, 45, 54);">11</font>** |
| **<font style="color:rgb(35, 45, 54);">炮 </font>** | <font style="color:rgb(35, 45, 54);">十字方向（上、下、左、右）</font> | <font style="color:rgb(35, 45, 54);"> 撞到的</font>**<font style="color:rgb(35, 45, 54);">第一个</font>**<font style="color:rgb(35, 45, 54);">棋子时，不会造成击退，而是把它当做“炮架”瞬间跃过，移动方向改成炮的中心和炮架的中心的连线的延长线，获得大量加速度</font> | **<font style="color:rgb(35, 45, 54);">1.13</font>** | **<font style="color:rgb(35, 45, 54);">12</font>** |
| **<font style="color:rgb(35, 45, 54);">相/象 </font>** | <font style="color:rgb(35, 45, 54);">四个“田”字对角线方向</font> | <font style="color:rgb(35, 45, 54);">质量较为重（极难被撞飞）。</font> | **<font style="color:rgb(35, 45, 54);">1.21</font>** | **<font style="color:rgb(35, 45, 54);">16</font>** |
| **<font style="color:rgb(35, 45, 54);">士/仕 </font>** | <font style="color:rgb(35, 45, 54);">四个斜线方向</font> | **<font style="color:rgb(35, 45, 54);"></font>**<font style="color:rgb(35, 45, 54);"> 质量极重。位移距离也偏短（力度满也不会在九宫格内反弹多次）</font> | **<font style="color:rgb(35, 45, 54);">1.4</font>** | **<font style="color:rgb(35, 45, 54);">25</font>** |
| **<font style="color:rgb(35, 45, 54);">兵/卒</font>** | <font style="color:rgb(35, 45, 54);">过河前：仅正前方   </font><font style="color:rgb(35, 45, 54);">过河后：前方、左、右</font> | <font style="color:rgb(35, 45, 54);">质量轻，极易被撞飞。在己方位移距离较短（力度满也难飞远）过河之后获得和车一样的力度和速度，但是无法往回移动（被撞回回自己半边后则降级，需重新向前移动过河）</font> | **<font style="color:rgb(35, 45, 54);">0.97</font>** | **<font style="color:rgb(35, 45, 54);">8</font>** |
| **<font style="color:rgb(35, 45, 54);">帅/将 </font>** | <font style="color:rgb(35, 45, 54);">十字方向（上、下、左、右）</font> | <font style="color:rgb(35, 45, 54);"> 质量同相，较大但是移动上限较低，不会过多移动</font> | **<font style="color:rgb(35, 45, 54);">1.3</font>** | **<font style="color:rgb(35, 45, 54);">22</font>** |


---

## <font style="color:rgb(35, 45, 54);">四、 游戏系统与操作</font>
### <font style="color:rgb(35, 45, 54);">1. 操作流程 (UI/UX)</font>
1. **<font style="color:rgb(35, 45, 54);">回合开始：</font>**<font style="color:rgb(35, 45, 54);"> 玩家点击选择己方任意一个可移动的存活的棋子，如若不存在则跳过回合。</font>
2. **<font style="color:rgb(35, 45, 54);">蓄力：</font>**<font style="color:rgb(35, 45, 54);">选择一个可移动方向后按住按键蓄力（蓄力到最大力后蓄力槽往回往复）。</font>
3. **<font style="color:rgb(35, 45, 54);">预判与发射：</font>**<font style="color:rgb(35, 45, 54);"> </font><font style="color:#DF2A3F;">轨迹线会显示第一段碰撞的反弹路线（根据技术可行性待定）</font><font style="color:rgb(35, 45, 54);">。选择力度之后棋子弹射而出。</font>
4. **<font style="color:rgb(35, 45, 54);">物理结算：</font>**<font style="color:rgb(35, 45, 54);"> 场上所有棋子进行台球般的碰撞、滑动、落水。直到所有棋子完全静止，回合结束，交由对方操作。</font>

## 五<font style="color:rgb(35, 45, 54);">、 游戏重要逻辑实现</font>
### 无需重力：当棋子飞出棋盘后则直接施加一段掉落棋盘的固定动画即可，无需特地计算重力
### 未碰撞时摩擦力：。
_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">v</font>**_<sub>_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">new </font>**_</sub>**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">= </font>**_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">v</font>**_<sub>_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">old </font>**_</sub>**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">× ( 1 − </font>**_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">D </font>**_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">×Δ</font>**<sub>_**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">t </font>**_</sub>**<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">)</font>**

D：阻尼系数取2.0（视情况定）

### 弹性碰撞：<font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">非弹性碰撞，弹性系数定在（0.92∼0.98）即可（视手感调整）</font>
### <font style="color:rgb(35, 45, 54);background-color:rgb(247, 242, 235);">碰撞后的旋转与摩擦力：</font>
**计算需要变量：**

+ _**<font style="color:rgb(35, 45, 54);">m</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">1</font>**_</sub>_**<font style="color:rgb(35, 45, 54);">,m</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">2</font>**_</sub><font style="color:rgb(35, 45, 54);">: 两棋子质量</font>
+ _**<font style="color:rgb(35, 45, 54);">v</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">1</font>**_</sub>_**<font style="color:rgb(35, 45, 54);">,v</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">2</font>**_</sub><font style="color:rgb(35, 45, 54);">: 两棋子碰撞前的线速度向量</font>
+ _**<font style="color:rgb(35, 45, 54);">ω</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">1</font>**_</sub>_**<font style="color:rgb(35, 45, 54);">,ω</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">2</font>**_</sub><font style="color:rgb(35, 45, 54);">: 两棋子碰撞前的角速度（自转速度）</font>
+ _**<font style="color:rgb(35, 45, 54);">e</font>**_<font style="color:rgb(35, 45, 54);">: 恢复系数</font>
+ _**<font style="color:rgb(35, 45, 54);">μ</font>**_<font style="color:rgb(35, 45, 54);">: 棋子间的碰撞摩擦系数 (决定旋转有多剧烈，取 0.2)</font>
+ _**<font style="color:rgb(35, 45, 54);">I</font>**_<font style="color:rgb(35, 45, 54);">: 棋子的转动惯量 (对于圆盘形棋子，</font>_**<font style="color:rgb(35, 45, 54);">I=1/2×m×r</font>**_<sup>_**<font style="color:rgb(35, 45, 54);">2</font>**_</sup><font style="color:rgb(35, 45, 54);">，r为棋子半径)</font>
+ <font style="color:rgb(35, 45, 54);">n：棋子中心连线的法线向量</font>
+ <font style="color:rgb(35, 45, 54);">t：垂直于法线向量的切线向量</font>

**<font style="color:rgb(35, 45, 54);">核心计算步骤 (极简版2D刚体碰撞冲量算法)</font>**

**<font style="color:rgb(35, 45, 54);">步骤一：求碰撞法线 (Normal) 和切线 (Tangent)</font>**<font style="color:rgb(35, 45, 54);">  
</font><font style="color:rgb(35, 45, 54);">设碰撞发生时，从棋子1圆心指向棋子2圆心的单位向量为法线 </font>_**<font style="color:rgb(35, 45, 54);">n</font>**_<font style="color:rgb(35, 45, 54);">。  
</font><font style="color:rgb(35, 45, 54);">切线向量 </font>_**<font style="color:rgb(35, 45, 54);">t </font>**_<font style="color:rgb(35, 45, 54);">就是法线顺时针旋转90度：</font>

<font style="color:rgb(35, 45, 54);"></font>

$ 

\vec{v}_{rel} = \vec{v}_2 - \vec{v}_1 

 $

**<font style="color:rgb(35, 45, 54);">步骤二：求相对速度</font>**<font style="color:rgb(35, 45, 54);">  
</font><font style="color:rgb(35, 45, 54);">接触点上的相对速度 </font>_**<font style="color:rgb(35, 45, 54);">v</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">rel</font>**_</sub><font style="color:rgb(35, 45, 54);"> 等于两球的线速度差，加上自转带来的线速度差。</font>

$ I = \frac{1}{2} m r^2 $

_<font style="color:rgb(35, 45, 54);">(此处简化了角速度对碰撞点线速度的影响，以满足休闲游戏性能)</font>_

**<font style="color:rgb(35, 45, 54);">步骤三：计算法向冲量（反弹力 </font>****<font style="color:rgb(35, 45, 54);">j</font>****<font style="color:rgb(35, 45, 54);">n</font>**_**<font style="color:rgb(35, 45, 54);">j</font>**__**<font style="color:rgb(35, 45, 54);">n</font>**_**<font style="color:rgb(35, 45, 54);">）</font>**

<font style="color:rgb(35, 45, 54);"></font>

$ 

j_n = \frac{-(1 + e) (\vec{v}_{rel} \cdot \vec{n})}{\frac{1}{m_1} + \frac{1}{m_2}}  $

<font style="color:rgb(35, 45, 54);">这就是普通的台球反弹力度。</font>

**<font style="color:rgb(35, 45, 54);">步骤四：计算切向冲量（产生旋转的摩擦力 </font>**_**<font style="color:rgb(35, 45, 54);">j</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">t</font>**_</sub>**<font style="color:rgb(35, 45, 54);">）</font>**<font style="color:rgb(35, 45, 54);">  
</font><font style="color:rgb(35, 45, 54);">切向速度投影：</font>

$ v_t = \vec{v}_{rel} \cdot \vec{t} $<font style="color:rgb(35, 45, 54);">  
</font><font style="color:rgb(35, 45, 54);">	</font>

<font style="color:rgb(35, 45, 54);">切向冲量：</font>

$ j_t = -v_t \cdot \frac{1}{\frac{1}{m_1} +\frac{1}{m_2}}

 $

<font style="color:rgb(35, 45, 54);">  
</font>_<font style="color:rgb(35, 45, 54);">	(注意：要用摩擦力限制它，所以 </font>__**<font style="color:rgb(35, 45, 54);">j</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">t</font>**_</sub>_<font style="color:rgb(35, 45, 54);"> 的最大值不能超过 </font>__**<font style="color:rgb(35, 45, 54);">μ×j</font>**_<sub>_**<font style="color:rgb(35, 45, 54);">n</font>**_</sub>_<font style="color:rgb(35, 45, 54);">)</font>_

**步骤五：计算主动碰撞棋子的速度和旋转**

速度：

$ \vec{V}_{1\_new}=\vec{V}_1 -(\frac{j_n}{m_1} )\cdot \vec{n} - (\frac{j_t}{m_1})\cdot \vec{t} $

旋转：

$ \omega_{1\_new} =\omega_{1\_old} -\frac{j_t \cdot r}{I_1} $

**步骤六：计算被碰撞棋子的旋转和速度**

速度：

$ \vec{V}_{2\_new}=(\frac{j_n}{m_2} )\cdot \vec{n} + (\frac{j_t}{m_2})\cdot \vec{t} $

旋转：

$ \omega_{2\_new} =\omega_{2\_old} +\frac{j_t \cdot r}{I_2} $

---

**摩擦衰竭：**

<font style="color:rgb(35, 45, 54);">旋转衰竭：</font>

$ 

\omega_{new} = \omega_{old} \cdot (1 - D_{angular} \cdot \Delta t) 





 $

$ \theta_{new} = \theta_{old} + \omega_{new} \cdot \Delta t

 $

**<font style="color:rgb(35, 45, 54);">D</font>**<sub>**<font style="color:rgb(35, 45, 54);">angular</font>**</sub>**<font style="color:rgb(35, 45, 54);">（角阻尼系数）：</font>**<font style="color:rgb(35, 45, 54);"> 建议取 </font>**<font style="color:rgb(35, 45, 54);">3.0 ~ 5.0</font>**<font style="color:rgb(35, 45, 54);">（比位移阻尼稍大一点）。因为视觉上，棋子滑动停下来之后，最好不要再原地长时间打转，早点停稳有利于回合结算。</font>

<font style="color:rgb(35, 45, 54);"></font>

<font style="color:rgb(35, 45, 54);">运动衰竭：</font>

$ V_{new} = V_{old} \cdot (1 - D_{move} \cdot \Delta t)  $

**<font style="color:rgb(35, 45, 54);">D</font>**<sub>**<font style="color:rgb(35, 45, 54);">move</font>**</sub>**<font style="color:rgb(35, 45, 54);">（运动阻尼系数）：</font>**<font style="color:rgb(35, 45, 54);"> 看情况定，需要比上面这个角阻尼更大一丢丢。不然棋子移动停下来了旋转还没停</font>
