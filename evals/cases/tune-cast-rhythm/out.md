改动与验证都完成了。先交五段报告，再说明几个需要你知道的点。

---

## 1. 静态关

| 命令 | 结果 |
|---|---|
| `cd frontend && npm ci && npm run test:run` | **29 passed (4 files)** — 原 24 条 + 新增 `cast-rhythm.test.ts` 5 条 |
| `cd frontend && npm run build`（`tsc -b && vite build`） | **通过**，`dist/` 产物含新常量（`castCharge:420…`），子路径 `/2026-10-9-Yi/` 在 `index.html` 中完好 |
| `cd frontend && npm run lint`（oxlint，未接 CI） | 退出码 0，无输出 |
| `cd backend && npm ci && npm test` | 4 pass / 0 fail（backend 本次未改动，按 skill「有改动加跑」仍顺手确认了一遍基线） |
| CI 约束哨兵本地复跑 | `AGENTS.md` 符号链接 OK、`CLAUDE.md` 75 行 ≤120、`core/` 无 DOM、依赖方向 OK、`App.tsx` `data-screen` = 6 |

本地绿 = CI 绿（同一份命令、同一份 `core/`）。

## 2. 操作路径（对应 feature map 条目）

黄金路径全程真实驱动（Playwright + headless Chrome，dev 构建 `:5173/2026-10-9-Yi/`）：

| 步骤 | feature map 条目 | 到达方式 |
|---|---|---|
| 屏 0 `rest` | rest.md | 首屏；`Enter`（先 `focus('.taiji')`，键盘走元素 `onKeyDown`）+ 单击 `.taiji` 两种都走了 |
| 屏 1 `generate` | generate.md | `Tab` 聚焦 → `Enter` 触发一次生长（节点数增加）→ `Esc` 跳过 |
| 屏 2 `matrix` | matrix.md | `Esc` 自动推进；`#to-cast` 聚焦后 `Enter` 进屏 3 |
| 屏 3 `cast` | cast.md | 完整跑「蓄—落—显」六拍 ×3 次（含 HEAD 基线对照一次）；另跑一次「进屏 3 立刻 `Esc`」的跳过路径 |
| 屏 4 `settle` | settle.md | 六爻落定后自动进入 |
| 屏 5 `network` | network.md | `#to-network` → 点 `#board-top/.card:nth-child(2)`（错卦）、`:nth-child(1)`（综卦）、`#board-right/.card:nth-child(1)`（互·去初）、`#board-left/.card:nth-child(6)`（变·初爻） |
| 部署等价 | CLAUDE.md 命令表 | `npm run build && npx vite preview --port 4188`，同一套黄金路径在生产构建上重跑一遍 |
| 弱动效 | cross-cutting-flows.md | `reducedMotion: 'reduce'` 上下文重跑屏 3（时长 ×0.15 生效：屏 3→settle 仅 1.36s） |

## 3. 证据

截图与 console 摘录：`/tmp/yi-verify-cast/`（`01-rest.png … 08-reduced-motion.png`、`F-*` 为逐轮原始帧、`console.txt`）

**屏 3 节拍（关键证据）**——`#cast-n` 变化时刻用 MutationObserver 采样，不靠固定 sleep：

```
HEAD 基线（临时还原后实测）: deltas [7, 853, 1165, 1166, 1167, 1166, 1167]  全程 6691ms
调快后（重复 4 次，含生产构建）: [5, 711, 949, 951, 949, 950, 950]        全程 5465ms
                                                     另一轮 900/…        5172ms（第一版系数，已弃用）
```
→ 一拍 **1166 → 950ms（−18.5%）**，六爻全程 **6.69s → 5.46s（−18.3%）**；常量层面 1070 → 860ms（−19.6%）。三次重复标准差 ≈1ms，节奏可复现。

**三段主次未倒**（`蓄:落:显` 比例）：`0.486 : 0.234 : 0.280` → `0.488 : 0.233 : 0.279` —— 逐段等比缩放，蓄段仍恒为最长。

**六爻自下而上不变**：`slotOrder` 采样显示 DOM 序 0 的 `.slot` 几何 y 最大（最下，`column-reverse`），先落定且标签为「初爻」，最后落定的是「上爻」（y=387，最上）；`#cast-n` 递增顺序 1→6 对应 初→上。

**无残帧**：屏 3 落定后进屏 5，`#cast-stack .yao` 六条全部 `ghost` 已清除、`getComputedStyle().opacity = 1`（`fill:forwards` 终态完好）。

**屏 5 点卡有可见反馈**（生产构建，DOM 文本口径）：默认「之卦/地雷复」→ 点错卦「错卦 · 全反/火风鼎」→ 点综卦「综卦 · 倒转/山水蒙」→ 点互·去初「互 · 去初/水地比」，`data-active` 徽标随点随切。

**console**：所有 error/warning 全渠道监听。屏 1–4 与减弱动效上下文零 error、零 warning。

## 4. 结论：**通过**

改动（5 个文件、+74/−14 行，未 commit——本 worktree 是 detached HEAD 的 eval 副本，按 CLAUDE.md「main 禁止直接 push」留给你开 `claude/<主题>` 分支）：

- `frontend/src/core/data.ts` — `DUR.cast*` 常量组：`castCharge 420 / castDrop 200 / castGap 240 / castGapLast 380 / castGlow 350`（= 原 520/250/300/480/440 一律 ×0.8 取整到 10ms），附推导注释
- `frontend/src/plays/playCast.ts` — 三段时间与拍间留白全部改用 `DUR.cast*`，**消掉了 `300 : 480` 这两个裸毫秒数**和 `DUR.settle + 220` 这个隐性加法
- `frontend/src/core/__tests__/cast-rhythm.test.ts` — 新增 5 条不变量：蓄段恒为三段最长、三段皆正且 `castGlow > castGap`、尾拍留白 ≥ 常规拍、`LINE_CN` 初→上次序、全程落在 4–7s
- `docs/agents/features/cast.md` — 同步新基线（0.95s / 5.5s，改前 1.17s / 6.7s）+ 回填已核实的自动化选择器（原文标着「待验证」，按 feature map「核实后回填」处理）
- `README.md` — 六屏表补注屏 3 实测节奏；「自检」节列入新的起卦节奏不变量

复现步骤：`cd frontend && npm ci && npm run test:run && npm run build && npm run dev` → 开 `http://localhost:5173/2026-10-9-Yi/` → `Enter` → `Esc` → `Enter`（`#to-cast` 聚焦）→ 看屏 3 六拍。回滚只需 revert 这 5 个文件。

硬约束自查：`base` 未动、六屏仍常驻挂载（`data-screen` = 6）、屏 5 无 `cancelAll`（屏 3 也无）、`CLAUDE.md`/`AGENTS.md`/`.github/` 零改动。

## 5. 未覆盖项

1. **未 commit / 未 push / 未开 PR** —— 本目录是 detached HEAD 的 eval worktree，`main` 禁止直接 push 且 PR 要等「校验」绿，不在本次授权范围内。改动留在工作区（新测试文件已 `git add -N` 以便 `git diff HEAD` 捕获，这是首轮 eval 踩过的坑）。
2. **未做主观「体感」裁决** —— 我只能证明「−18.5%/−18.3%」这个客观降幅和三段比例不变；「蓄段是否还拖」需要你在真机上看一眼。第一版我试过把系数压到一拍 900ms（全程 5.17s，降幅同样 ~20%），后来回退成逐段严格 ×0.8——**理由是先保证比例一位不动，把叙事完整性钉死，宁可少削 3%**。若你更在意体感再快一点，只改这 5 个数字、别碰 `playCast.ts`。
3. **16 万次概率采样、卦名/15 格断言未单独复核** —— 它们与本次改动无关，但 `test:run` 跑的是 CI 同一份、全绿，不存在被绕过的情况。
4. **preview 端口不是 4173** —— 4173 被另一会话的 preview 占着（返回的是别的项目 `深入理解 AI Agent` 的页面），我另起 4188 验的本仓产物；用完已关，未留常驻进程。
5. **屏 5 卦卡选择器回填只做了 cast.md** —— 我顺手核出了 matrix/settle 的 `#to-cast`/`#to-network` 但**故意回退了**，不让它们混进这个「只做一件事」的 PR。建议单独开一个 docs PR 回填（下面第 2 条也归那里）。

---

### 两点附带发现（不属于本次改动，我没有顺手「修」）

1. **屏 5 互卦有既有 console warning**：`Invalid keyframe value for property transform: translateY(NaNpx)`。触发于点「互」类卦卡 → `stage.ts:232/243` 的 `(j - src(j)) * STEP`。**HEAD 基线同样复现，与本次节奏改动无关**。根因指向 `measure()` 里 `parseFloat(getComputedStyle(benStack).rowGap)`：`--ygap` 只在 `global.css:331` 的媒体查询断点里给 `.f-stack` 赋值，视口落在断点外时 `rowGap` 解析不出数字 → `NaN`。按 Ban list「禁止把看似 bug、实为有意的行为顺手修掉」+「禁止运行时测量几何」，这属于要单独定性的架构问题，交你判断是缺陷还是断点假设未覆盖。
2. **文档里有一处描述与实际不符**（我没改，因为不确定原意）：`cross-cutting-flows.md` 写「`Esc` 跳过当前屏（屏 1/3 直落定，**其余推进**）」，但 `App.tsx:92-96` 的 `skip()` 只处理 `generate` 和 `cast`，屏 0/2/4/5 按 `Esc` 无任何反应。截图佐证：屏 3 的 `Esc` 落定路径我实测过（`escSkipCastMs: 4ms` 直接进 settle），其余屏的「推进」我测不到。
