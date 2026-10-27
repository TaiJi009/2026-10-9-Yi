# CLAUDE.md

《易经》六十四卦互动站点（「变易」）。单仓库双项目：`frontend/`（Vite + React + TS，站点的全部）
与 `backend/`（Node + Express API 骨架，当前仅 `GET /api/health`），各自独立 package.json / lockfile。
需要 Node 24。线上 https://taiji009.github.io/2026-10-9-Yi/（Y 大小写敏感）。

**主从分工**：README.md = 完整源头（why 与叙事），本文件 = 给 agent 的约束（what + 指针），
`docs/agents/feature-map.md` = 功能地图（产品有什么、代码在哪、怎么自动化定位）。
改 README 的架构/约束内容时须同步检查本文件。本文件 ≈100 行封顶（CI 哨兵上限 120）：
新约束优先合并旧条目，不要只追加。

## 完成定义（动手前先读）

- 没有「跑过并附证据」的完成声明一律无效：改动必须过 `skills/verify-app/`——
  静态关（`npm run test:run` + `npm run build`）全绿，再按 skill 的五段格式输出验证结论。
- 改动功能入口 / 快捷键 / DOM 结构 / `data-screen` 时，必须同步 `docs/agents/feature-map.md`。
- review 里口头说过的「不许做 X」，当天落地成三选一：CI 哨兵 / 本文件禁令 / 范畴性消除。

## 硬约束（CI 兜底，违者红，勿绕）

- `vite.config.ts` 的 `base: '/2026-10-9-Yi/'` **不能动**（CI 子路径哨兵）。
- CI 的 job 名必须叫 `check`（main 的 ruleset 写死 required context，改名 PR 永远 BLOCKED）。
- **main 禁止直接 push**：开 `claude/<主题>` 分支 → `gh pr create --base main` → 等「校验」绿 → Squash。
- `core/` 禁止 import 任何 DOM / 浏览器 API；依赖方向
  `core → state → anim → grow|stage|plays → screens → App.tsx`（CI 哨兵全链路检查）。
- 本文件 ≤120 行、AGENTS.md 必须是指向本文件的符号链接（CI 哨兵）。
- `docs/` 默认不入库，唯 `docs/agents/` 例外（agent 工程资产必须随仓库走）。

## 目录约定（架构五规则，改结构前先读）

1. **常规路径必须比捷径少做决定**：名词唯一——屏（`screens/`）、控制器（`grow|stage/`）、
   编排（`plays/`）、动画原语（`anim/`）各有唯一创建方式；照抄现有模式即正确做法。
2. **禁止的依赖必须机械失败**：违反依赖方向由 CI 哨兵拦截，报错信息写明该改哪里。
3. **每个持久值只有一个写者**：STORE 只由控制器写、React 只读；动画像素只由控制器造。
4. **新功能加新文件，不在共享根上开分支**：新屏 = `screens/` 新文件 + `App.tsx` 一处注册。
5. **例外必须狭窄、显式、按架构变更评审**：Ban list 的豁免在 PR 里说明理由，不留口头特例。

## Ban list（agent 惯犯模式；逐条迁 CI——已硬化：六屏常驻；其余随真实失败待迁）

- 禁止卸载非当前屏：六屏常驻挂载，`App.tsx` 只切 `.active` 类——卸载会杀 CSS 淡入与
  WAAPI `fill:forwards` 终态（CI 哨兵兜底）。
- 屏 5 连点禁止 `ANIM.cancelAll()`（切屏解药，会杀卡片入场尾帧）——只用局部 `SHOW.seq` + `cancelGuest()`。
- 禁止重渲染控制器写入的容器：React 管结构、WAAPI 管像素，动画子树由控制器命令式建造。
- 禁止按位置贴卦名：一律由 bits 反查（`RULES.bitsToName` / `bitsToTrigram` / `bitsToSixiang`）。
- 语义层不得用紫、交互层不得用白：L5 动爻是全站唯一最亮档，紫罗兰 `--accent` 只承载交互态。
- 禁止运行时测量几何：屏 1 尺寸按 `core/data.ts` 的 `GROW` 公式预算（节点宽 96 即溢出）。
- 禁止「修」看似 bug、实为有意的行为（清单见 `docs/agents/feature-map.md`「已知坑」）。

## 看似 bug、实为有意（不许「修」）

- 屏 1 顶端八卦顺序随机、屏 2 方阵固定先天序——两屏不一致是有意为之。
- 屏 1 先抽出的「仪」在左边：左右顺序由第一抽决定，不是固定「阳左阴右」。
- 屏 5 六爻皆静时展示位留空标「无动爻」：此时之卦 === 本卦，语义坍塌，留空是正确行为。

## 命令与调试（细节见 README「开发环境」「自检」）

| 命令 | 作用 |
|---|---|
| `npm ci && npm run dev`（前端） | 开发服务器 http://localhost:5173/2026-10-9-Yi/ —— **注意带子路径** |
| `npm run test:run`（前端） | vitest 规则断言（CI 跑的就是它） |
| `npm run build`（前端） | `tsc -b && vite build` |
| `npm run preview`（前端） | 部署等价检查 http://localhost:4173/2026-10-9-Yi/ |
| `npm run lint`（前端） | oxlint（尚未接入 CI） |
| `npm ci && npm run dev`（后端） | http://localhost:8787/api/health |
| `npm test`（后端） | node --test 冒烟测试 |

`vite.config.ts` 已把 `/api` 代理到 8787；前端目前**不调用 API**（Pages 上会 404），后端是骨架。
开发模式控制台有 `window.YI`（生产构建没有）：`YI.RULES.bitsToName([1,1,1,1,1,1])` →
「乾为天」、`YI.STAGE.SHOW.bits` → 展示位当前卦、`YI.goto('matrix')` → 直接跳屏。

## PR 规范

- 一个 PR 只做一件事，50–1000 行为宜、鼓励拆分；commit message 用中文、面向三个月后要回滚的人。
- 领域速记（bit 模型、两套随机、大衍概率、动爻标「动」）与视觉约定的完整版：
  README「规则实现」「视觉约定」；速查版：`docs/agents/feature-map.md`「领域速记」。
