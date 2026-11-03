#!/usr/bin/env bash
#
# PreToolUse hook: block `gh pr merge --admin`.
#
# --admin is how a red build reaches main, and a merge here also deploys to
# production. Branch protection enforces admins too, but that is a setting on
# GitHub that can change, and this is a file in the repo.
#
# This judges a command rather than a word, so a commit message or a grep that
# mentions the flag is unaffected.
#
# Exit 0 allows, and exit 2 blocks with the message on stderr. Escape hatch for an
# owner-approved emergency: WEBJS_ALLOW_ADMIN_MERGE=1.

[ "${WEBJS_ALLOW_ADMIN_MERGE:-0}" = "1" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)
[ -n "$cmd" ] || exit 0

# Judge each shell segment as its own command. A match has to start with
# `gh pr merge`, after any env assignments, and carry --admin.
if printf '%s\n' "$cmd" | tr ';&|' '\n\n\n' \
  | grep -Eq '^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*gh[[:space:]]+pr[[:space:]]+merge([[:space:]].*)?[[:space:]]--admin([[:space:]=]|$)'; then
  cat >&2 <<'EOF'
BLOCKED: `gh pr merge --admin` merges over failing checks.

A PR merges only when all its checks are green (.agents/rules/workflow.md), and a
merge here also deploys. Fix the failing check, then merge without --admin.
Owner-approved emergency only: WEBJS_ALLOW_ADMIN_MERGE=1.
EOF
  exit 2
fi
exit 0
