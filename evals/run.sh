#!/bin/sh
# eval 爬山：每个用例在独立 git worktree 里跑 headless agent，不污染当前工作区。
# 用法：./evals/run.sh <case-name>        例：./evals/run.sh tune-cast-rhythm
# 产物：cases/<case>/out.md（agent 的验证报告）+ cases/<case>/diff.patch（实际改动）。
# 打分：按 rubric.md；异模型复核按 judge.md（codex/另一家模型）；结果记 score.md。
# harness 替换点：claude -p 可换 codex exec --sandbox workspace-write。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
SKILL="$ROOT/skills/verify-app/SKILL.md"
CASE=${1:?用法: $0 <case-name>，可选值见 cases/ 目录}
CASEDIR="$HERE/cases/$CASE"
[ -f "$CASEDIR/task.md" ] || { echo "用例不存在：$CASEDIR/task.md"; exit 1; }

WT=$(mktemp -d "/tmp/yi-eval-$CASE-XXXXXX")
git -C "$ROOT" worktree add --detach "$WT" HEAD >/dev/null
cleanup() {
  # diff HEAD 覆盖 staged+unstaged；再列 untracked（stage 过的改动 git diff 看不见——首轮教训）
  git -C "$WT" diff HEAD > "$CASEDIR/diff.patch" 2>/dev/null || true
  git -C "$WT" ls-files --others --exclude-standard >> "$CASEDIR/diff.patch" 2>/dev/null || true
  git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "$WT"
# 注意：worktree 无 node_modules，agent 需自行 npm ci（静态关的第一步）。
# 时间盒：优先用 gtimeout/timeout（20 分钟）；agent 侧另受 skill §6「先交报告再深挖」约束。
RUNNER=""
if command -v gtimeout >/dev/null; then RUNNER=gtimeout; elif command -v timeout >/dev/null; then RUNNER=timeout; fi
if [ -n "$RUNNER" ]; then
  $RUNNER 1200 claude -p --dangerously-skip-permissions \
    "严格遵循仓库 CLAUDE.md 的完成定义与 Ban list，按以下 verification skill 的流程完成任务。
$(cat "$SKILL")
任务：$(cat "$CASEDIR/task.md")" > "$CASEDIR/out.md" || echo "（退出码 $? —— 超时或失败，产物以 diff 为准）"
else
  claude -p --dangerously-skip-permissions \
    "严格遵循仓库 CLAUDE.md 的完成定义与 Ban list，按以下 verification skill 的流程完成任务。
$(cat "$SKILL")
任务：$(cat "$CASEDIR/task.md")" > "$CASEDIR/out.md" || echo "（退出码 $? —— 失败，产物以 diff 为准）"
fi

echo "== 完成 =="
echo "产物：$CASEDIR/out.md 与 $CASEDIR/diff.patch（worktree 已清理）"
echo "下一步：按 $HERE/rubric.md 打分 → judge.md 异模型复核 → 记入 $HERE/score.md"
