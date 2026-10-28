# Feature Map — 变易（六十四卦互动站点）

> 本目录从**用户视角**映射每一个功能：它是什么、怎么到达、怎么用、怎么驱动（浏览器自动化）。
> **每个功能一个文件**（`features/`），横跨多功能的旅程单列 `features/cross-cutting-flows.md`。
> 驱动/复现某个界面之前，先读对应的功能文件。**这些文件教的是「怎么用」，不是「怎么实现」**
> ——实现细节看代码，代码比任何文档都变得快。
> 本地图是**持续维护的验证源头**：要证明一个改动有效或没破坏什么，就按下方规范真实驱动 dev 构建。

## 维护规则

- 凡改动功能入口 / 快捷键 / DOM 结构 / `data-screen` 的 PR，必须同步更新对应功能文件。
- 验收标准：给 agent 一张「截图 + ??？」级的模糊反馈，它能凭本地图定位功能并复现。
- 标「待验证」的条目宁窄勿错；错误的选择器比空白更害 agent。核实后回填。

## 基线前置条件（Baseline preconditions）

除非功能文件另有覆盖，驱动前默认：

1. dev 构建已起（`cd frontend && npm run dev`），无端口冲突；
2. 页面可访问（注意子路径 `/2026-10-9-Yi/`）；
3. 无残留模态/浮层，处于默认首屏（太极呼吸）；
4. 某前置不可满足时（如 headless 无浏览器工具），**跳过该项并在验证证明里写明**，不许静默跳过。

## 驱动规范（Driving conventions）

- 选择器**优先 `section[data-screen="…"]` 与语义化 id**，class 选择器只是兜底；
- **轮询可观察的终态**（`data-screen` 变化、`.active` 类、元素出现），禁止固定 sleep——
  流式/动画是非确定性的，等终态不等时长；
- **优先键盘（已注册的按键）而非坐标点击**——键盘走的是能量用户路径，也更稳；
- 预期「无 console 报错」的流程，必须全程开着 console 监听走完；
- 开发者调试入口 `window.YI` 仅 dev 构建可用（生产没有），不要在生产等价检查（preview）里依赖它；
- 真实 OS 级交互（文件拖放、原生右键菜单）视为 manual，除非功能文件声明支持。

## 功能文件索引

| 文件 | 屏 | `data-screen` |
|---|---|---|
| [features/rest.md](features/rest.md) | 0 太极呼吸 | `rest` |
| [features/generate.md](features/generate.md) | 1 生演 | `generate` |
| [features/matrix.md](features/matrix.md) | 2 六十四卦方阵 | `matrix` |
| [features/cast.md](features/cast.md) | 3 起卦 | `cast` |
| [features/settle.md](features/settle.md) | 4 成卦 | `settle` |
| [features/network.md](features/network.md) | 5 错综演算 | `network` |
| [features/cross-cutting-flows.md](features/cross-cutting-flows.md) | 横跨多屏的旅程（键盘、跳屏、调试） | — |
