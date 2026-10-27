# CLAUDE.md 

《易经》六十四卦互动站点（「变易」）。单仓库双项目：`frontend/`（Vite + React + TS，站点的全部）
与 `backend/`（Node + Express API 骨架，当前仅 `GET /api/health`），两者各自独立的
package.json / lockfile，互不依赖。**README.md 是最完整的说明文档，动代码前先读它。**

## 常用命令

需要 Node 24。前端、后端是两个独立项目，命令各自在 `frontend/`、`backend/` 目录里执行：

| 命令 | 作用 |
|---|---|
| `npm ci && npm run dev`（前端） | 开发服务器 http://localhost:5173/2026-10-9-Yi/ —— **注意带子路径** |
| `npm run test:run`（前端） | vitest 规则断言（CI 跑的就是它） |
| `npm run build`（前端） | `tsc -b && vite build` |
| `npm run preview`（前端） | 部署等价检查 http://localhost:4173/2026-10-9-Yi/ |
| `npm run lint`（前端） | oxlint（尚未接入 CI） |
| `npm ci && npm run dev`（后端） | http://localhost:8787/api/health |
| `npm test`（后端） | node --test 冒烟测试 |

`vite.config.ts` 已把 `/api` 代理到 8787，两个服务都开着即可联调，前端代码里不写域名。
前端目前**不调用 API**（Pages 上会 404），后端是为将来留的骨架。

## 架构边界（改代码前必读）

依赖方向：`core/ → state/ → anim/ → grow|stage|plays → screens → App.tsx`

| 目录 | 装什么 | 规矩 |
|---|---|---|
| `core/` | 纯数据 + 纯函数 + 生演节点模型 | **不 import 任何有 DOM 的东西**，测试跑 `environment: 'node'`（无 jsdom） |
| `anim/` | WAAPI 注册表 + 命令式爻栈/SVG 构造 | 不认识业务语义，只认 `el` + keyframes |
| `state/store.ts` | 单一状态（values/bits/moves/variants） | **写它的是控制器，不是 React** |
| `grow/` `stage/` | 屏 1、屏 5 的状态控制器 | 只依赖 `core/` 和 `anim/`，操作 ref 递进来的容器 |
| `plays/` | 屏 2/3/4 的编排函数 | 同样接收 refs，不 `document.querySelector` |
| `screens/` `components/` | React 骨架与静态件 | **永不重渲染控制器写入的容器** |

核心取舍：**React 管结构，WAAPI 管像素**。动画子树由控制器 `createElement(NS)` 建好、
append 进 ref 指向的空容器，React 从不碰它们——否则 reconciler 与动画引擎争抢同一个
style/class，动画会被下一次 render 抹平。

## 三条不能碰的硬约束

1. **六屏全部常驻挂载**（`App.tsx` 只切 `.active` 类）。别按 React 惯例把非当前屏卸载——
   会杀死 CSS 的 0.42s 淡入和所有 WAAPI `fill:forwards` 终态。
2. **屏 5（`stage/`）连点绝不可用 `ANIM.cancelAll()`**——那是切屏解药，会连带杀掉卡片入场
   尾帧。本屏只用局部 `SHOW.seq` + `cancelGuest()`，只取消在飞的复制体。
3. **屏 5 本卦框与展示位框必须同行、等几何、固定 gap**。平移量 dx/dy、交卦错身量
   ±3×(爻高+间距)、互卦「源爻↔目标爻」映射全是依赖它的常数；两框几何一变，公式全废。

## 部署与协作

- `vite.config.ts` 的 `base: '/2026-10-9-Yi/'` **不能动**：CI 有子路径哨兵
  （`dist/index.html` 必须含该串，否则红）。线上 https://taiji009.github.io/2026-10-9-Yi/（Y 大小写敏感）。
- **main 受分支保护，禁止直接 push**。流程：开分支 `claude/<主题>` → 提交推送 →
  `gh pr create --base main` → 等「校验」工作流变绿 → Squash and merge。
  合并进 main 后 deploy.yml 才构建并发布 Pages（触发路径 `frontend/**`）。
- **CI 的 job 名必须叫 `check`**：main 的 ruleset（protect-main）把 required_status_checks
  写死成这个 context，改名或拆 job 会让 PR 永远停在 BLOCKED。
- `docs/` 已被 .gitignore 排除（仅本地保留）。`docs/六十四卦演变规则.md` 是规则唯一真源。

## 领域与视觉约定（细节见 README）

- 爻 = 1 bit，自下而上 `[初,二,三,四,五,上]`，阳=1；三爻值 = b0 + b1×2 + b2×4
  （坤0 震1 坎2 兑3 艮4 离5 巽6 乾7）；重卦值 = 下卦 + 上卦×8。
- 14 个变体（变/错/综/交/互×5）全部由 `core/rules.ts` 的纯函数算出；
  **卦名一律由 bits 反查**（`RULES.bitsToName` / `bitsToTrigram` / `bitsToSixiang`），
  绝不按位置贴名——生演树是随机生长的，位置与卦不对应。
- 两套独立随机：屏 1 生演抽爻 1/2 均匀，且**第 2 个子节点的新爻 = 第 1 个的反**
  （保证第 d 层恒 2^d 个互异节点，有专门断言）；屏 3 起卦走**大衍筮法**非均匀概率
  （老阴 1/16 · 少阳 5/16 · 少阴 7/16 · 老阳 3/16）。
- **明度管语义，颜色管交互**：灰阶 tone ramp（L0 近黑 → L5 近白）承载语义层级，
  L5 动爻是全站唯一最亮档，**任何情况不得改用紫色**；紫罗兰 `--accent` 只承载交互状态
  （焦点环 / 选中卡 / 推进按钮 / 站点图标阳面）。语义层不得用紫，交互层不得用白。
- 动爻在爻的**左侧**标「动」字（不用 ○/× 区分阴阳）。翻爻只 morph `scaleX`，不换 DOM。
- 系统开启「减弱动态效果」时，所有时长 ×0.15 并关掉抖动层。
- 仓库语言为中文：代码注释、提交信息、文档都用中文，保持一致。
