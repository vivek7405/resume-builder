#!/usr/bin/env bash
#
# PreToolUse hook: block editing a tracked file in the repo's primary checkout.
#
# Task work happens in a linked worktree, and the primary checkout stays an
# untouched mirror of main (.agents/rules/workflow.md). Two agents in one checkout
# collide, so this makes the rule hold rather than asking anyone to remember it.
# guard-branch-context.sh does not cover it, because it only asks, only on main,
# and steps aside in bypass mode. Untracked and gitignored files stay editable.
#
# This judges the FILE's directory, never the session's cwd, because an edit can
# target a worktree file by absolute path from anywhere.
#
# Exit 0 allows, and exit 2 blocks with the message on stderr. Fails open if git or
# jq cannot answer, so a broken check never stops the work. Escape hatch for a
# deliberate exception: WEBJS_NO_WORKTREE_GATE=1.

[ "${WEBJS_NO_WORKTREE_GATE:-0}" = "1" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

fp=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)
[ -n "$fp" ] || exit 0

dir=$(dirname "$fp")
[ -d "$dir" ] || exit 0
git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Both paths absolute. From a subdirectory git prints --git-common-dir as relative,
# so comparing the raw strings would treat the primary as a worktree and fail open.
git_dir=$(git -C "$dir" rev-parse --path-format=absolute --git-dir 2>/dev/null) || exit 0
common_dir=$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
[ -n "$git_dir" ] && [ -n "$common_dir" ] || exit 0

# Only the primary checkout has these equal.
[ "$git_dir" = "$common_dir" ] || exit 0

git -C "$dir" ls-files --error-unmatch -- "$fp" >/dev/null 2>&1 || exit 0

top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)
cat >&2 <<EOF
BLOCKED: '$fp' is a tracked file in the primary checkout ($top).

Task work happens in a linked worktree, one per task (.agents/rules/workflow.md).
The start-work skill cuts one:
  git worktree add -b <prefix>/<slug> ../resume-builder-<slug> origin/main

Deliberate exception only: WEBJS_NO_WORKTREE_GATE=1.
EOF
exit 2
