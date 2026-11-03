#!/usr/bin/env bash
#
# PreToolUse hook: WARN on a `git commit` that changes something the docs
# describe, when the commit stages no doc surface.
#
# The docs here describe how the project is run: CI, the deployment, the data
# model, the workflow. Changing one of those and leaving the docs behind is the
# usual way they rot. This is the doc twin of require-tests-with-src.sh, and like
# it, this warns rather than blocks, because plenty of these commits need no doc
# edit (a dependency bump, for one).
#
# What a hook cannot do is know WHICH surfaces a change needs. That is the
# doc-sync skill's job, so this only reminds and points at it.
#
# Scope: fires only on `git commit`, and inspects the STAGED diff. Skip it for a
# genuinely internal commit with WEBJS_NO_DOC_GATE=1.

set -euo pipefail

if [ "${WEBJS_NO_DOC_GATE:-}" = "1" ]; then
  exit 0
fi

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
if [ -z "$cmd" ]; then exit 0; fi
# Match `git commit` as a whole word, so git commit-tree and the like do not trip it.
if ! printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]-])git commit([^[:alnum:]-]|$)'; then
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then exit 0; fi

staged=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$staged" ]; then exit 0; fi

described=$(printf '%s\n' "$staged" | grep -E \
  '^(\.github/workflows/|\.hooks/|\.claude/(hooks|skills)/|\.claude/settings\.json$|package\.json$|db/schema\.server\.ts$|compose[^/]*\.ya?ml$|Dockerfile$|\.env\.example$)' || true)
if [ -z "$described" ]; then exit 0; fi

docs=$(printf '%s\n' "$staged" | grep -E \
  '(^|/)(AGENTS|CLAUDE|CONVENTIONS|README)\.md$|^\.agents/rules/|^\.github/pull_request_template\.md$|^app/\(app\)/architecture/' || true)
if [ -n "$docs" ]; then exit 0; fi

files=$(printf '%s' "$described" | tr '\n' ' ')
jq -n --arg ctx "Heads up: this commit changes something the docs describe (${files% }) and stages no doc surface. If a documented behaviour moved, use the doc-sync skill and stage the surfaces it applies to, on this PR. A dependency bump or similar needs none, and WEBJS_NO_DOC_GATE=1 silences this for a commit like that." '{
  hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: $ctx }
}'
exit 0
