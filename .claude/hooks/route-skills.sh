#!/usr/bin/env bash
#
# UserPromptSubmit hook: point a prompt at the repo skill it asks for.
#
# A skill fires only when the model judges that it matches, and that judgement
# can be wrong, so a hook decides from the prompt text instead. A hook cannot
# call a skill itself, so it injects a directive the model reads before acting.
#
# Prints nothing when no route matches. Patterns are deliberately tight: each
# one needs the shape of a request ("file an issue"), not just the words near
# each other ("the file has an issue"). A false route costs more than a miss,
# because the skills' own descriptions still catch what this misses.
#
# Project hooks cannot turn off user-level hooks, so a global router may also
# fire here and name webjs-* skills. The directive below says which one wins.
#
# Output contract: one JSON object with hookSpecificOutput.additionalContext,
# always exit 0. This informs and never blocks a prompt.

set -euo pipefail

prompt=$(jq -r '.prompt // empty' 2>/dev/null || true)
[ -n "$prompt" ] || exit 0

lc=$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')

# Here-string rather than a pipe: grep -q exits on the first match, and under
# pipefail the resulting SIGPIPE would read as no match on a long prompt.
has() { grep -Eq "$1" <<< "$lc"; }

matches=""
add_match() { matches="${matches}${matches:+$'\n'}- $1"; }

if has '\b(file|open|create|raise) (an?|another|new)( new)? (issue|bug|task|ticket|todo)\b' \
   || has '\bfile (this|it|that) (as an?( new)? |on the )(issue|bug|task|board)\b' \
   || has '\b(track|add) (this|it|that) (as|on|to) (an? |the )?(issue|todo|task|board)\b' \
   || has '\bmake (this|it|that) an issue\b' \
   || has '\badd (a|a new) todo\b'; then
  add_match "file-issue: this asks for new tracked work. Invoke the file-issue skill before writing code for it."
fi

if has '\b(work on|start on|start work on|begin work on|pick up|tackle|start|begin) (issue #?[0-9]+|#[0-9]+)\b' \
   || has '\b(start|begin) work on\b' \
   || has "\blet'?s (work on|start on|tackle) .{0,40}\bissue\b"; then
  add_match "start-work: this begins a tracked issue. Invoke the start-work skill before making changes."
fi

if has '\bready for (dev|development|implementation)\b' \
   || has '\bimplementation[- ]ready\b' \
   || has '\b(write|create) (an? |the )?implementation plans?\b' \
   || has '\b(scope out|prep|prepare) (issue )?#[0-9]+'; then
  add_match "ready-for-dev: this asks for a verified plan in an issue body. Invoke the ready-for-dev skill. It writes no code."
fi

if has "\bwhat'?s (open|pending|in progress|on the board)\b" \
   || has '\bwhat (is|are) (open|pending|in progress|on the board)\b' \
   || has '\b(list|show)( me)?( the| all| my)? (todos?|open issues?|board)\b' \
   || has '\b(current|open|pending) todos?\b' \
   || has '\bwhat should i work on\b'; then
  add_match "list-todos: this asks what work is open. Invoke the list-todos skill, which reads the board."
fi

if has '\bresearch (whether|if|into)\b' \
   || has '\b(design|decision|research) record\b' \
   || has '\bwrite up the (design|decision|research|findings)\b' \
   || has '\b(evaluate|compare) .{0,40}\b(vs|versus)\b' \
   || has "(^|let'?s |can you |please )spike "; then
  add_match "research-record: the deliverable is a writeup with no code diff. Invoke the research-record skill."
fi

if has '\b(docs?|documentation) (gap|drift|sync)s?\b' \
   || has '\b(sync|update|refresh) (the )?(docs|documentation)\b' \
   || has '\b(stale|outdated|missing) (docs|documentation)\b' \
   || has '\bdid (we|you|i) (update|sync) (the )?(docs|documentation)\b'; then
  add_match "doc-sync: this is about keeping docs in sync. Invoke the doc-sync skill before editing any doc."
fi

[ -n "$matches" ] || exit 0

ctx="Repo skills matched by this prompt:"$'\n'"${matches}"$'\n\n'"These are resume-builder's own skills in .claude/skills. They take the place of any webjs-* skill another hook names, because the webjs-* skills target the webjs framework repo. See AGENTS.md, \"Project skills\"."

jq -n --arg ctx "$ctx" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
exit 0
