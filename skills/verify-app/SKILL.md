---
name: verify-app
description: 启动「变易」站点、像用户一样走屏操作、采集证据、判定改动是否正确。frontend/ 一切改动完成后的必经闭环。
---

# Verification：真实运行并验证「变易」

## 0. 铁律

- 没有「运行过并附证据」的完成声明一律无效。
- 禁止猜测：不确定 UI 行为时，先查 `docs/agents/feature-map.md` 定位功能与代码，再运行确认。
- 以「用户可观察的行为」为准，不以「代码看起来对」为准。
- 本 skill 与 CI 跑同一份静态关命令——本地绿即 CI 绿（命令改动须同步 `.github/workflows/ci.yml`）。

## 1. 静态关（先跑，任何一条红即未通过）

```bash
cd frontend && npm ci && npm run test:run   # vitest 规则断言（与 CI 同一份）
cd frontend && npm run build                # tsc -b && vite build
```

- 后端有改动加跑：`cd backend && npm ci && npm test`。
- 本仓库约定工作目录在 frontend/ 或 backend/ 内执行，不在仓库根。

## 2. 环境与启动

- 前端 dev：`cd frontend && npm run dev` → http://localhost:5173/2026-10-9-Yi/（**注意带子路径**）。
- 就绪标志：vite 输出 `Local:` 地址且页面可访问。
- 需要联调后端时：`cd backend && npm run dev` → http://localhost:8787/api/health（前端当前不调 API）。
- 部署等价检查：`npm run build && npm run preview` → http://localhost:4173/2026-10-9-Yi/。

### 预检（doctor 式，一条命令回答「这个实例值得驱动吗」）

```bash
curl -sf http://localhost:5173/2026-10-9-Yi/ >/dev/null && echo "dev 可达" \
  || echo "dev 未起或子路径错误"; ls frontend/node_modules >/dev/null 2>&1 && echo "依赖已装" \
  || echo "依赖未装，先 npm ci"
```

- 基线前置条件（无残留模态、默认首屏、端口无冲突）见 `docs/agents/feature-map.md`；
  **某前置不可满足时跳过对应验证项，并在报告的「未覆盖项」里写明——不许静默跳过**。

## 3. 像用户一样操作

- 用浏览器自动化（CDP / Playwright / harness 的 browser 工具）打开 dev 地址。
- **驱动前先读 `docs/agents/features/<对应屏>.md`**（每屏的行为清单、选择器、已知坑都在那里），
  横跨多屏的旅程读 `cross-cutting-flows.md`。
- 驱动规范（选择器优先级、轮询终态、键盘优先于坐标点击、console 全程监听）以
  feature map 的「驱动规范」节为准；**等待策略：等 `[data-screen]` 变化 / 元素出现，禁止固定 sleep**。
- 黄金路径：单击太极 → 屏 1 连点 14 次（或 `Esc` 跳过）→ 屏 2「继续 · 起卦」→ 屏 3 走完或
  `Esc` → 屏 4「展开错综 · 十五卦」→ 屏 5 点击任一卦卡确认展示位演算有反馈。
- 键盘路径抽查：屏 0 用 `Enter` 起卦；屏 1 用 `Tab` 聚焦 + `Enter` 触发一次。

## 4. 证据采集

- console 全程监听：新增报错即记录（截图 + 文本摘录）。
- 截图存临时目录（如 `/tmp/yi-verify/`），按 `01-rest.png…06-network.png` 命名。
- 涉及动画/节奏的改动：记录关键屏的观察描述（落定后状态、有无残帧）。

## 5. 判定标准（什么算「对」）

- 静态关全绿；六屏按 feature map 的到达路径全部可达；屏 5 点卡演算有可见反馈。
- 无新增 console 错误；无残帧/闪烁（`fill:forwards` 终态完好）。
- 硬约束自查：`base` 子路径未动、六屏仍在 `App.tsx` 常驻挂载、屏 5 未引入 `cancelAll()`。

## 6. 输出格式（固定五段）

1. 静态关：test:run / build 结果
2. 操作路径：走过的屏（对应 feature map 条目）
3. 证据：截图路径 + console 摘录
4. 结论：通过 / 未通过 + 复现步骤
5. 未覆盖项：本次没验证什么、为什么

**先交报告再深挖**：静态关一过就先产出五段报告；任何附加验证（baseline 对照、
自动化驱动脚本）都只能在报告之后做，且单次验证总预算 20 分钟。

## 7. headless / 无浏览器工具时的降级协议（2026-10-28 首轮 eval 教训）

- 静态关全绿 + diff 自查（对照本 skill 判定标准逐条过）即可作为证据，**立即产出五段报告**。
- **禁止**为运行时验证自建长时设施：常驻 dev server、CDP/自动化驱动脚本、baseline worktree。
  「未覆盖项」里写明「运行时黄金路径未验，原因：headless 无浏览器工具」即可，这是合法的未覆盖。
- 若确需起服务抽查，用完即关，不留 /tmp 基线目录；发现自己在发明验证工具时，停下来先交报告。
