---
name: file-issue
description: File new tracked work on the resume-builder repo and its Resume Builder board. Use when the user asks to file an issue, open an issue, create a task, file a bug, track something as a todo, or add work to the board, while working in this repo. Replaces webjs-file-issue here, which targets the webjs framework repo. Also use before writing code for new work that has no issue yet.
when_to_use: |
  Examples that should trigger this skill:
    "file an issue for the PDF export"
    "open an issue about the broken preview"
    "track this as a todo"
    "file a bug for the autosave race"
  Do NOT trigger for: starting work on an existing issue (start-work), listing what is open (list-todos), or editing an existing issue.
---

# File an issue on the Resume Builder board

Work on this repo is tracked as GitHub issues on `vivek7405/resume-builder`, shown on the board at https://github.com/users/vivek7405/projects/15.

## Inputs

From the user's description, take:

- A short imperative **title** under 70 characters, shaped like a good commit subject.
- A **label**: `enhancement` for a feature or improvement, `bug` for something broken, `documentation` for docs. Default to `enhancement`.
- A **body** in the shape below.

If the description is very thin, ask one question first: scope it now, or file a placeholder with just the title? A placeholder has one short paragraph under Problem and says "needs scoping".

## Steps

1. **Check for a duplicate.**

   ```sh
   gh api "search/issues?q=repo:vivek7405/resume-builder+is:issue+<keywords>&per_page=10" \
     --jq '.items[] | "#\(.number) [\(.state)] \(.title)"'
   ```

   If one matches, ask whether to file anyway or use it.

2. **Ground the body in the code.** The implementer may be an agent with no access to this conversation, so the body is the whole brief. Before filing, open the code and collect real paths, the landmines (prior incidents, non-obvious constraints), the invariants the change must keep, and the test layers and doc surfaces it touches. Paths recalled from memory are the ones that turn out stale, so grep them.

   Then reread the draft as if you had never seen this conversation. If you could not start from it without a question, or without first hunting for the code, it is not ready. Naming an area ("the editor") instead of a path is the usual failure.

3. **Create the issue.** Write the body to a scratch file and build the request with `jq --rawfile`, so backticks and `$` in the body never reach the shell. Use the job's temp directory when one exists.

   ```sh
   jq -n --rawfile body <scratch>/issue-body.md \
     '{title:"<title>", body:$body, labels:["enhancement"], assignees:["vivek7405"]}' > <scratch>/issue.json
   gh api -X POST repos/vivek7405/resume-builder/issues --input <scratch>/issue.json \
     --jq '"\(.number) \(.html_url)"'
   ```

4. **Add it to the board and set Todo.** `item-add` leaves a card with no Status on this board, so set it explicitly. Run this as one shell invocation, because sourced variables do not survive between tool calls.

   ```sh
   source .claude/gh-ids.env
   ITEM=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" \
     --url https://github.com/vivek7405/resume-builder/issues/<N> --format json --jq '.id')
   gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM" \
     --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_TODO"
   ```

5. **Report** the number, the title, the link, and that the card is in Todo.

## Issue body shape

```markdown
## Problem

What is wrong or missing, in one or two paragraphs.

## Design / approach

The proposed direction, and alternatives considered if any.

## Implementation notes (for the implementing agent)

- Where to edit: concrete files and functions, with paths.
- Landmines: known traps, prior incidents (link them), non-obvious constraints.
- Invariants: the rules this must not break (link AGENTS.md or `.agents/rules/workflow.md`).
- Tests and docs: which test layers and which doc surfaces this touches.

## Acceptance criteria

- [ ] An observable result
- [ ] A counterfactual proves the test fires, where applicable
- [ ] Tests cover the new behaviour at every layer it touches
- [ ] Docs updated if a documented surface changed
```

## What this skill does not do

It does not cut a branch or open a PR (that is `start-work`), and it does not move a card past Todo.

## Failure handling

- If the create call fails, show the error and offer to retry.
- If adding to the board fails after the issue exists, report that partial state plainly ("issue #N created, not on the board yet"). A scope error is fixed with `gh auth refresh -s project`, which the user runs.
