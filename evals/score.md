# 分数台账

| 日期 | skill 版本 | 模型 | 用例 | 分数 | 未达标项 | 下一步 |
|---|---|---|---|---|---|---|
| 2026-10-28 | verify-app v1 | claude 2.1.310（headless -p） | tune-cast-rhythm | **8.0** | 证据完整（五段最终报告未产出，45min 超预算被收割） | skill 补 headless 降级协议与时间盒；二轮复跑 |
| 2026-10-28 | verify-app v1.1（+降级协议/时间盒） | claude 2.1.310（headless -p） | tune-cast-rhythm | **9.75** | 证据完整扣 0.25（截图证据在 /tmp 临时目录，未随 eval 归档） | judge 待接入；归档截图到 evals/ |

## tune-cast-rhythm · 迭代 2 评分明细（coordinator：主会话；diff 已独立复验）

| 维度 | 分 | 依据 |
|---|---|---|
| 结果正确 | 10 | 一拍 1166→950ms（−18.5%）、六爻 6.69s→5.46s（−18.3%，MutationObserver 采样，σ≈1ms）；三段比例 0.486:0.234:0.280 → 0.488:0.233:0.279 几乎不动；coordinator 在干净 worktree 重放 diff 后独立复跑：29/29 测试 + 构建全绿 |
| 流程遵循 | 10 | **先交五段报告**（skill §6 纪律生效）；驱动前查 feature map 并按其回填选择器；轮询终态不 sleep；键盘路径、生产构建等价检查、减弱动效上下文全部覆盖 |
| 禁令遵守 | 10 | 发现既有 NaN warning 与文档错误均**不顺手修**、单独上报（正确引用 Ban list）；未 commit（main 保护意识）；零 cancelAll；硬约束自查全过 |
| 证据完整 | 9 | 五段报告完整含复现步骤与回滚方案；扣分：截图在 /tmp/yi-verify-cast 未随 eval 归档 |

**迭代对比**：45min 无报告（8.0）→ 预算内先交报告 + 5 条新不变量测试 + 两个真实发现（9.75）。
skill v1.1 的「先交报告」与「降级协议」条款被验证有效。

**迭代 2 附带产出（已处理）**：
1. diff 已作为正式提交入库（`e6a3d13`，feat: 屏 3 起卦节奏同比缩短约 20%）。
2. agent 发现的文档错误已修：cross-cutting-flows.md 的「Esc 其余推进」→ 实测只有屏 1/3 响应 Esc。
3. agent 发现的既有缺陷已记录待定性：屏 5 互卦 NaN warning（stage.ts rowGap 解析，见 features/network.md）。

**judge 状态**：codex wrapper 指向的 ChatGPT.app 内置二进制在本机不存在，异模型复核暂无法执行；
备选方案：ZCode workflow 指定另一 provider 的模型做 judge。接入前 judge 列为未覆盖项。

## tune-cast-rhythm · 迭代 1 评分明细（coordinator：主会话）

| 维度 | 分 | 依据 |
|---|---|---|
| 结果正确 | 9 | 静态关全绿（24/24 测试 + 构建通过，验证器在全新 worktree 重放后独立复验）；一拍 1070→850ms（−20.6%，符合「约 20%」）；蓄段仍为三段最长，主次未倒 |
| 流程遵循 | 8 | 静态关完整（npm ci→test→build）；自建 yi-baseline worktree 做前后对照（加分）；同步更新了 feature-map 与 README（遵守 CLAUDE.md）；但总耗时 45min 超预算、未按五段格式交付 |
| 禁令遵守 | 10 | diff 无任何 ban list 违规；且顺手把 playCast.ts 的魔法数字收进 `DUR.cast*` 自文档化常量组，附「蓄必须恒为最长」不变量注释——质量超标 |
| 证据完整 | 5 | out.md 为空（任务被收割时报告未写出）；证据链靠会话转录取证（提取 python 补丁）→ 重放 → 复验重建，成立但属事故恢复而非 agent 自证 |

**事故记录**：任务 45min 未收尾被停；worktree 清理陷阱先于 diff 捕获失效（agent 已将改动 stage，
`git diff` 为空），改动本体经 `~/.claude/projects/` 会话转录恢复。已把「超时/降级/产物捕获」
三条教训写入 skill 与 run.sh。

**agent 行为观察（后座驾驶员笔记）**：
1. 表现出超越任务要求的验证意识（baseline 对照、driver 构建）但预算失控——skill 需要
   「先交报告再深挖」的输出纪律。
2. 无浏览器工具时它在 /tmp/yi-driver 自建了 CDP 驱动脚本走 golden path——方向正确但
   成本过高，应由 skill 给定降级协议，而不是让它现场发明。
