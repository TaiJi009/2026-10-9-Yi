#!/bin/sh
# eval 爬山：对每个用例 spawn 一个 headless agent 按 skill 干活，产出 out.md。
# 用法：./evals/run.sh            （跑一轮）
#       不满分 → 改 skill 或 rubric → 再跑，循环到 10/10 或轮数上限。
# harness 替换点：claude -p 可换成 codex exec --sandbox workspace-write，
# 或 ZCode workflow（多 subagent 并行跑用例 + 汇总打分）。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
SKILL="$HERE/../skills/verify-app/SKILL.md"
RUBRIC="$HERE/rubric.md"

for case in "$HERE"/cases/*/; do
  name=$(basename "$case")
  echo "== case: $name =="
  claude -p "严格遵守以下 skill 与仓库约束（CLAUDE.md、docs/agents/feature-map.md）完成任务。
$(cat "$SKILL")
任务：$(cat "$case/task.md")" > "$case/out.md"
  # 打分：coordinator 按 rubric 打分 → 用 judge.md 提示词换模型复核 → 追加进 score.md
done
echo "完成。下一步：按 $RUBRIC 打分，异模型 judge 复核，结果写入 $(dirname "$HERE")/evals/score.md"
