---
name: plan-issue
description: Write a short, verified implementation plan into a tracked resume-builder issue, then move its card to Planned. Use when the user asks to plan an issue, get an issue ready for development, prep or scope out an issue, or make todos implementation-ready, while working in this repo. Replaces webjs-ready-for-dev here, which targets the webjs framework repo. Writes no code, and is meant to take minutes.
when_to_use: |
  Examples that should trigger this skill:
    "plan #12"
    "plan this issue"
    "get #12 and #14 ready for development"
    "scope out #12 so an agent can pick it up"
  Do NOT trigger for: filing a new issue (file-issue), implementing an issue (start-work), listing what is open (list-todos), or a writeup with no implementation to follow (research-record).
---

# Plan an issue, quickly

A plan is done when an agent with no access to this conversation could implement the issue without a discovery phase. The deliverable is the issue body. This skill writes no code.

## Keep it short

Planning is not the work, so it stays small. Aim for a few minutes per issue.

- **Read only what the change touches:** the issue, its comments, and the files it will edit. Follow one reference further if a step depends on it. No survey of the repo, and no sweep of other projects.
- **One pass, inline.** Write the plan once and post it. No subagent for a single issue, no review round, no polishing.
- **Decide, do not research.** Pick what fits `ARCHITECTURE.md` and `PRODUCT-PRINCIPLES.md`, and give the reason in one line. If the issue would break a principle, say so when you report. A choice that is cheap to change later needs no investigation.
- **Do not stop on an unknown.** If a quick look does not settle something, take the safer default and list it under Assumptions for the implementer to check. Name any that the user should weigh in on when you report.
- **Match the size of the change.** A small fix gets a few lines. If a section has nothing to say, say so in one line.
- **Stop when the test passes,** even if more could be said. If you have spent much longer than expected, post what you have with the open points under Assumptions.

Two early exits:

- If the issue can already be implemented as written, say so, leave the body alone, and move the card.
- If planning would take about as long as doing it, say so and suggest `start-work`.

Read the framework's exact contract only when a step depends on it: `bunx webjs source <Export>`.

## Steps

1. **Read the issue.**

   ```sh
   gh api repos/vivek7405/resume-builder/issues/<N> --jq '.title, .body'
   gh api "repos/vivek7405/resume-builder/issues/<N>/comments?per_page=100" --jq '.[].body'
   ```

   An existing plan is a starting point. Check the paths it cites, and keep a decision already on the issue unless the code has moved.

2. **Write the body,** in the shape below, and post it. Build the payload with `jq --rawfile`, so backticks and `$` never reach the shell.

   ```sh
   jq -n --rawfile b <scratch>/issue-<N>-body.md '{body:$b}' > <scratch>/patch-<N>.json
   gh api -X PATCH repos/vivek7405/resume-builder/issues/<N> --input <scratch>/patch-<N>.json --jq .number
   ```

3. **Confirm the body landed.** Five means the shape is met.

   ```sh
   gh api repos/vivek7405/resume-builder/issues/<N> --jq '.body' \
     | grep -cE '^## (Problem|Approach|Steps|Tests and docs|Acceptance criteria)$'
   ```

4. **Move the card to Planned,** only after that check, since a card in Planned promises the body can be implemented. Run this as one shell invocation, because sourced variables do not survive between tool calls.

   ```sh
   source .claude/gh-ids.env
   ITEM=$(gh api graphql -f query='query($n:Int!){repository(owner:"vivek7405",name:"resume-builder"){
     issue(number:$n){projectItems(first:5){nodes{id project{number}}}}}}' -F n=<N> \
     --jq '.data.repository.issue.projectItems.nodes[] | select(.project.number == 15) | .id')
   [ -n "$ITEM" ] || { echo "#<N> is not on the board"; exit 1; }
   gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM" \
     --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_PLANNED"
   ```

   If the issue is not on the board, add it the way `file-issue` does, then run this again.

5. **Report** in a few lines per issue: the decisions made, any assumptions the user should check, and anything found stale.

## The body, in this order

```markdown
## Problem
What is wrong or missing. Correct anything stale.

## Approach
The decision and why, in a few lines. Any alternative rejected, with the reason. What not to widen into, if that is a real temptation.

## Steps
Ordered edits, each naming the file and function. Quote current code only where it prevents a misread. Note the commit the plan was checked against (`git log -1 --format=%h`).

Assumptions, if any, as a short list.

## Tests and docs
Tests by file path and what they assert, plus the check that fails without the change. Doc surfaces by path (see `doc-sync`). Layers or surfaces that do not apply, in one line.

## Acceptance criteria
A checkbox list of observable results.
```

## A plan is not ready if

- it names an area ("the editor") rather than a path
- it says "consider" or "we could" where a decision belongs
- it cites a path nobody checked
- it lists "add tests" rather than naming the file

## Several issues

Check for overlap first, in a line or two: which files does each touch? Plan overlapping issues one after another, and name the shared file in both plans. If one depends on another's output, plan the first and tell the user the second is queued, since a plan against code about to change is stale when it lands.

Plan a small batch inline, one after another. Use background agents only for a larger batch of unrelated issues: one per issue, in a single message, without worktree isolation, because a fresh worktree has no dependencies for running a repro. Give each this brief, with its issue number filled in:

> Plan issue #N in the resume-builder repo by following `.claude/skills/plan-issue/SKILL.md`, including its limits on time. Work alone and settle every call yourself, listing what you cannot settle under Assumptions. You share this checkout with other agents, so do not edit any repo file, run a git command that changes state, or install anything. Scratch files go outside the repo. Your only changes are this issue's body and its card. Do not open a PR, comment, file an issue, or change labels. Report your decisions and assumptions.

An agent's report is not proof, so run the step 3 check yourself for each issue.

## Failure handling

- If the issue turns out to be already fixed or wrong, do not close it. Report what you found and let the user decide.
- If the PATCH fails, show the error, keep the draft, and retry. The card stays where it is.

## What this skill does not do

It does not write code, cut a branch, open a PR, file issues, close anything, or relabel anything. The only card move it makes is to Planned.
