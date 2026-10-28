# 屏 3 · 起卦（cast）

- **是什么**：大衍筮法起卦——六爻自下而上逐爻抽取，每爻走「蓄→落→显」三段节奏。
- **用户如何到达**：屏 2 点「继续 · 起卦」。
- **怎么用**：每爻自动演示「蓄—落—显」，一拍实测约 **0.95s**、六爻全程约 **5.5s**（2026-10-28 调快约 20%，
  改前分别为 1.17s / 6.7s）；也可 `Esc` 跳过直接落定全部六爻。
- **概率**（大衍，非均匀）：老阴 6 = 1/16 · 少阳 7 = 5/16 · 少阴 8 = 7/16 · 老阳 9 = 3/16；
  老阴/老阳为**动爻**。概率有 16 万次采样的统计测试。
- **代码位置**：`screens/CastScreen.tsx` + `plays/playCast.ts`；概率与卦名逻辑在 `core/rules.ts`；
  节奏常量在 `core/data.ts` 的 `DUR.cast*`（castCharge/castDrop/castGap/castGapLast/castGlow——
  蓄段必须恒为三段最长，要调快请同比缩放五个值，别只动一个；`core/__tests__/cast-rhythm.test.ts`
  会把这条不变量与「全程 4–7s」直接钉红）。一拍 = castCharge + castDrop + castGap。
- **自动化定位**（2026-10-28 dev 构建实测可用）：`section[data-screen="cast"]`；
  爻栈 `#cast-stack`、爻槽 `#cast-stack .slot`（DOM 序 0 = 初爻，CSS `column-reverse` 把它画在最下）、
  单爻 `.slot .yao`（`data-ghost`/`data-yang`/`data-moving`）、标签 `.slot .val`、计数 `#cast-n`。
  等终态用 `#cast-n` 文本变为 `6`，别等固定时长。
- **已知坑**：动爻视觉 = 全程最亮纯白 + 光晕 + 左侧「动」字（不是 ○/×）；`Esc` 跳过后六爻直接落定属正常。
