# 跨屏旅程（cross-cutting flows）

> 横跨多屏、不属于单一功能文件的流程与入口。驱动这些旅程时逐屏参考对应功能文件。

## 全局键盘

| 按键 | 作用 | 生效范围 |
|---|---|---|
| `Esc` | 跳过当前屏（屏 1/3 直落定，其余推进；逐屏语义细节待验证） | 任意屏 |
| `Enter` / `Space` | 等效单击太极 | 屏 0 |
| `Tab` → `Enter`/`Space` | 聚焦并触发可点节点 | 屏 1 |

## 屏间推进链

```
rest --单击--> generate --完成/Esc--> matrix --「继续·起卦」--> cast --落定/Esc--> settle --「展开错综·十五卦」--> network --「重新起卦」--> rest
```

- 屏间切换 = `ANIM.cancelAll()` + 切 `.active` 类 + 触发对应 play（`App.tsx` 的 FSM.goto）；
  **切屏场景是 `cancelAll()` 唯一合法的使用地**（屏 5 连点场景禁用，见 network.md）。
- 六屏**全部常驻挂载**，切换只改 `.active` 类；任何验证都应确认非当前屏仍存在于 DOM。

## 调试入口（仅 dev 构建）

- 控制台 `window.YI`（生产构建没有，preview 等价检查里不可依赖）：
  - `YI.RULES.bitsToName([1,1,1,1,1,1])` → 「乾为天」
  - `YI.RULES.buildVariants(bits).length` → 15
  - `YI.RULES.generationOrder().map(t=>t.name).join('')` → 「乾兑离震巽坎艮坤」
  - `YI.STAGE.SHOW.bits` → 展示位当前卦
  - `YI.goto('matrix')` → 直接跳屏（'rest'|'generate'|'matrix'|'cast'|'settle'|'network'）

## 弱动效模式

系统开启「减弱动态效果」时，所有时长 ×0.15 并关掉抖动层——验证动画相关的改动时要考虑此模式下的行为差异。
