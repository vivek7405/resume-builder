#!/usr/bin/env bash
#
# UserPromptSubmit hook: point a prompt at the repo skill it asks for.
#
# A skill fires only when the model judges that it matches, and that judgement
# can be wrong, so a hook decides from the prompt text instead. A hook cannot
# call a skill itself, so it injects a directive the model reads before acting.
#
# Two parts. A standing policy goes out on every prompt, because keyword routing
# misses the request that starts as a question and turns into tracked work. The
# routes are added only when one matches, and their patterns are deliberately
# tight: each needs the shape of a request ("file an issue"), not just the words
# near each other ("the file has an issue"). A false route costs more than a
# miss, because the policy and the skills' own descriptions catch what this misses.
#
# pr-review and pilots are personal skills, and run is built into Claude Code,
# so they live outside this repo. The rest are in .claude/skills.
#
# The global router in ~/.claude stays silent in a checkout with this file.
# The directive below still says which skill wins, for a machine where it does not.
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

if has '\b(file|open|create|raise) (an?|another|new)( new| github)? (issue|bug|task|ticket|todo)\b' \
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

if has '\bplan (issue )?#[0-9]+' \
   || has '\bplan (this|that|the) issue\b' \
   || has '\bready for (dev|development|implementation)\b' \
   || has '\bimplementation[- ]ready\b' \
   || has '\b(write|create) (an? |the )?implementation plans?\b' \
   || has '\b(scope out|prep|prepare) (issue )?#[0-9]+'; then
  add_match "plan-issue: this asks for a short, verified plan in an issue body. Invoke the plan-issue skill. It writes no code and is meant to take minutes."
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

if has '\b(review|audit) (the |my |this |that )?(pr|diff|branch|changes?|commit)\b' \
   || has '\breview #[0-9]+' \
   || has '\b(do|run|give|start) (me )?(a |an )?code ?review\b'; then
  add_match "pr-review: this asks for a code review. Invoke the pr-review skill and do the review yourself, inline. Never hand it to a subagent or run it in rounds. A plain review ask stops at the findings. If the ask says to fix them, apply the fixes too."
fi

if has '\bverify (the |this |that |it )?(change|fix|feature|pr|works?)\b' \
   || has '\b(confirm|prove|make sure) .{0,30}\b(works|working)\b' \
   || has '\b(manually|actually) (test|try)\b'; then
  add_match "run: this asks to confirm a change works. Invoke the run skill, then drive the real app and observe it. Passing tests and type checks do not show that a page works."
fi

if has '\b(re)?deploy\b' \
   || has '\bpilots\b' \
   || has '\b(rollback|roll back)\b'; then
  add_match "pilots: this touches deployment. Invoke the pilots skill. A merge to main deploys to production, and a rollback changes what is live, so it needs the user's agreement."
fi

read -r -d '' standing <<'EOF' || true
resume-builder skill policy: before doing the work in this prompt, check the available skills and invoke any whose purpose matches. This holds even when the prompt reads as a question or research but the work it leads to is something a skill governs, such as filing an issue with file-issue before writing code for new work.
EOF

ctx="$standing"
if [ -n "$matches" ]; then
  ctx="${ctx}"$'\n\n'"Skills matched by this prompt:"$'\n'"${matches}"$'\n\n'"The repo's skills in .claude/skills take the place of any webjs-* skill another hook names, because the webjs-* skills target the webjs framework repo. See AGENTS.md, \"Project skills\", for the one exception."
fi

jq -n --arg ctx "$ctx" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
exit 0
