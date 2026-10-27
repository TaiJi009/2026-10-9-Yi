# 分数台账

| 日期 | skill 版本 | 模型 | 用例 | 分数 | 未达标项 | 下一步 |
|---|---|---|---|---|---|---|
| 2026-10-28 | verify-app v1 | claude 2.1.310（headless -p） | tune-cast-rhythm | **8.0** | 证据完整（五段最终报告未产出，45min 超预算被收割） | skill 补 headless 降级协议与时间盒；二轮复跑 |

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
