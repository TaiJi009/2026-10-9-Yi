# Feature Map — 变易（六十四卦互动站点）

> 作用：让零上下文的 agent 不再满 UI 乱撞——听到「屏 3 卡了」就知道去哪、点什么、查哪个文件。
> 维护规则：凡改动功能入口 / 快捷键 / DOM 结构 / `data-screen` 的 PR，必须同步更新本文件。
> 验收标准：给 agent 一张「截图 + ??？」级的模糊反馈，它能凭本文件定位功能并复现。
> 标「待验证」的条目宁窄勿错；核实后回填。

## 总表

| 屏 | `data-screen` | 是什么 | 用户如何到达 | 代码入口 | 自动化定位 |
|---|---|---|---|---|---|
| 0 | `rest` | 太极呼吸，等待起卦 | 默认首屏 | `screens/RestScreen.tsx`；FSM 在 `App.tsx` | `section[data-screen="rest"]` |
| 1 | `generate` | 生演：太极→两仪→四象→八卦，点击驱动共 14 次，可跳过 | 屏 0 单击太极（或 `Enter`/`Space`） | `screens/GenerateScreen.tsx` + 控制器 `grow/grow.ts` + 节点模型 `core/grow-model.ts` | `section[data-screen="generate"]` |
| 2 | `matrix` | 六十四卦 8×8 方阵，静态展示 | 屏 1 完成（或 Esc）后进入 | `screens/MatrixScreen.tsx` + `plays/playMatrix.ts` | `section[data-screen="matrix"]` |
| 3 | `cast` | 起卦：六爻自下而上大衍抽取，「蓄—落—显」节奏，可跳过 | 屏 2 点「继续 · 起卦」 | `screens/CastScreen.tsx` + `plays/playCast.ts` + 大衍概率在 `core/rules.ts` | `section[data-screen="cast"]` |
| 4 | `settle` | 成卦：本卦 + 之卦，各带卦名 | 屏 3 六爻落定后进入 | `screens/SettleScreen.tsx` + `plays/playSettle.ts` | `section[data-screen="settle"]` |
| 5 | `network` | 错综演算：三栏对照 + 展示位，点卦卡当场演算 | 屏 4 点「展开错综 · 十五卦」 | `screens/NetworkScreen.tsx` + 控制器 `stage/stage.ts` + `stage/variants.ts` | `section[data-screen="network"]`；卦卡选择器待验证 |

## 全局键盘与跳屏

- `Esc`：任意屏跳过（屏 1/3 直落定，其余推进——逐屏语义待验证）。
- 屏 0：`Enter` / `Space` 等效单击太极；屏 1：可点节点均可用 `Tab` 聚焦、`Enter`/`Space` 触发。
- dev 控制台 `window.YI`（生产构建没有）：`YI.goto('matrix')` 直接跳屏、
  `YI.STAGE.SHOW.bits` 展示位当前卦、`YI.RULES.bitsToName(bits)` 卦名反查。

## 已知坑（看似 bug、实为有意，不许「修」）

- 屏 1 顶端八卦顺序是**随机**的，屏 2 方阵是**固定**先天序——两屏不一致是有意为之。
- 屏 1 先抽出的「仪」在**左边**：左右顺序由第一抽决定，不是固定「阳左阴右」。
- 屏 5 六爻皆静时展示位**留空**标「无动爻」：之卦 === 本卦，语义坍塌，留空是正确行为。
- 屏 1 节奏「感觉慢」是有意的：`DUR` 720/560/520ms，第 3 段与下一次点击并行 → 感知间隔 ≈1.1s。

## 关键预算（改屏 1 前必读）

- 尺寸按 `core/data.ts` 的 `GROW` 公式预算、**不测量**：`x(col,d) = (col+.5)/2^d × W`、`y(d) = Y0 − d×RH`。
- 宽度校验 `8×84 + 7×41 = 959 ≤ 1000`：节点再加宽到 96 就溢出。
- 翻爻只 morph `scaleX`，不换 DOM；SVG 爻线的 `transform-box: fill-box` 不能丢（`transform-origin` 会跑偏）。

## 领域速记

- 爻 = 1 bit 自下而上 `[初…上]`，阳=1；三爻值 = b0 + b1×2 + b2×4（坤0 震1 坎2 兑3 艮4 离5 巽6 乾7）；重卦值 = 下卦 + 上卦×8。
- 两套独立随机：屏 1 生演 1/2 均匀、第 2 个子节点 = 第 1 个之反（每层恒 2^d 互异节点，有专门断言）；
  屏 3 大衍筮法：老阴 1/16 · 少阳 5/16 · 少阴 7/16 · 老阳 3/16。
- 14 个变体（变/错/综/交/互×5）全由 `core/rules.ts` 纯函数算出；卦名一律 bits 反查；动爻左侧标「动」字。
- 完整论证见 README「屏 1」「屏 5」「规则实现」「视觉约定」。
