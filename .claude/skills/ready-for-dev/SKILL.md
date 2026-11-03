---
name: ready-for-dev
description: Get tracked resume-builder issues ready for development by writing a verified implementation plan into each issue body. Use when the user asks to get issues ready for development, prep an issue for dev, make todos implementation-ready, write implementation plans, or scope out an issue, while working in this repo. Replaces webjs-ready-for-dev here, which targets the webjs framework repo. Writes no code.
when_to_use: |
  Examples that should trigger this skill:
    "get #12 and #14 ready for development"
    "prep #12 for dev"
    "make those todos implementation-ready"
    "scope out #12 so an agent can pick it up"
  Do NOT trigger for: filing a new issue (file-issue), implementing an issue (start-work), listing what is open (list-todos), or a writeup with no implementation to follow (research-record).
---

# Get tracked issues ready for development

"Ready for development" is a definition of done for planning. An issue is ready when an agent with no access to the conversation that produced it can implement it end to end, with no discovery phase and no questions.

The deliverable is the issue body. Nothing here writes code, and the card stays in Todo, because this board has no Ready column.

## Inputs

The issue numbers, from the prompt or from a set named earlier in the conversation. Settle every open design call yourself from standard practice, the repo's conventions, and the framework source, and record what settled it. Settling those calls is the work, so they do not go back to the user.

## Steps

1. **Read each issue and its comments.**

   ```sh
   gh api repos/vivek7405/resume-builder/issues/<N> --jq '.title, .body'
   gh api "repos/vivek7405/resume-builder/issues/<N>/comments?per_page=100" --jq '.[].body'
   ```

   An existing plan in the body is a starting point, so verify it against the current code rather than trusting it.

2. **Check the batch for conflicts before planning.** Map each issue to the files it will touch.

   - Disjoint files: plan them together.
   - Same file, different regions: plan them together, and name the other issue and the shared file in each plan as a landmine.
   - Same function, or one consuming the other's output: plan the upstream one now and tell the user the other is queued, since a plan against code about to be rewritten is stale when it lands.

3. **Plan each issue.** One issue can be planned inline. For several, spawn one background agent per issue in a single message and give each the brief below. These agents read the repo and do not write to it, so `git checkout` and anything else that moves HEAD is off limits, because they share the checkout. Scratch files go outside the repo.

4. **Write the body.** Build the payload with `jq --rawfile`, so backticks and `$` never reach the shell.

   ```sh
   jq -n --rawfile b <scratch>/issue-<N>-body.md '{body:$b}' > <scratch>/patch-<N>.json
   gh api -X PATCH repos/vivek7405/resume-builder/issues/<N> --input <scratch>/patch-<N>.json --jq .number
   ```

5. **Verify against the section contract.** An agent reporting success is not proof.

   ```sh
   gh api repos/vivek7405/resume-builder/issues/<N> --jq '.body' \
     | grep -cE '^## (Problem|Design / approach|Implementation plan|Tests|Docs|Acceptance criteria|Out of scope)$'
   ```

   Seven means the contract is met.

6. **Report** per issue: the decisions settled and anything found stale. Then give the conflict map, so the user can see which issues can run in parallel.

## The plan body, in this order

```markdown
## Problem
Keep the substance. Verify every claim and path against current code, and note corrections.

## Design / approach
The settled decision and why it is right. Alternatives rejected, with reasons.

## Implementation plan
Ordered steps. Each names the file and function, shows the code as it is today, and how it should read after. Note the HEAD commit (`git log -1 --format=%h`) so line anchors are dated.

## Tests
Every applicable layer by file path: `test/<feature>/*.test.ts`, `test/<feature>/browser/*.test.js`, `test/<feature>/e2e/`. The counterfactual that fails when the change is reverted. Which layers do not apply and why.

## Docs
Every doc surface by path, with what changes on it (see `doc-sync`). If none applies, say so.

## Acceptance criteria
A checkbox list of observable results.

## Out of scope
What the implementer must not widen into.
```

Where the framework is involved, read the exact contract with `bunx webjs source <Export>` and from `.agents/skills/webjs/SKILL.md`, not from React or Next habits. Keep to the prose rule in `.agents/rules/workflow.md`.

## A plan is not ready if

- it names an area ("the editor") rather than a path
- it says "consider" or "we could" where a decision belongs
- it cites a line nobody checked against current HEAD
- it lists tests as "add tests" rather than naming the file and the assertion
- it leaves the doc surfaces unnamed

## Failure handling

- If the issue turns out to be already fixed or wrong, do not close it. Report what you found and let the user decide.
- If a plan contradicts an earlier decision on the issue, keep the new one only with evidence (code that moved, a measurement). A preference is not evidence.
- If the PATCH fails, show the error, keep the draft, and retry.

## What this skill does not do

It does not write code, cut a branch, open a PR, file issues, move cards, close anything, or relabel anything.
