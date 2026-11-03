---
name: start-work
description: Start work on a tracked issue in the resume-builder repo. Use when the user says "work on #12", "start issue 12", "pick up #12", "tackle the export issue", or begins any code change while working in this repo. Replaces webjs-start-work here, which targets the webjs framework repo. Cuts a dedicated worktree and branch from origin/main, moves the card to In Progress, opens a draft PR early, and carries the definition of done and the merge rules.
when_to_use: |
  Examples that should trigger this skill:
    "work on #12"
    "start work on issue 12"
    "pick up #12"
    "let's work on the export issue"
    "merge #13"
    "merge the PR and delete the branch"
  Also use right after file-issue, before writing code for new work that had no issue. The standing rule is no code before a tracked issue and a branch cut for it.
  Do NOT trigger for: listing what is open (list-todos), or filing a new issue (file-issue).
---

# Start work on a resume-builder issue

## Precondition: the work has a tracked issue

If there is no issue for this work, stop, run `file-issue`, then come back with the number. Untracked work never shows on the board and its PR closes nothing.

When unsure whether one exists, search, and when still in doubt, file it, since a duplicate is cheap to close and untracked work is not. If the user described the issue by topic, resolve the number:

```sh
gh api "search/issues?q=repo:vivek7405/resume-builder+is:issue+is:open+<topic>&per_page=20" \
  --jq '.items[] | "#\(.number) \(.title)"'
```

If several match, ask which one.

## Steps

1. **Check the issue is open and assigned.**

   ```sh
   gh api repos/vivek7405/resume-builder/issues/<N> \
     --jq '{number,state,title,labels:[.labels[].name],assignees:[.assignees[].login]}'
   ```

   If it is closed, ask whether to reopen it or pick another. If it has no assignee, assign vivek7405.

2. **Find the card.**

   ```sh
   gh api graphql -f query='query($n:Int!){repository(owner:"vivek7405",name:"resume-builder"){
     issue(number:$n){projectItems(first:5){nodes{id project{number}
     fieldValueByName(name:"Status"){...on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}' \
     -F n=<N> --jq '.data.repository.issue.projectItems.nodes[] | select(.project.number == 15)'
   ```

   An empty result means it is not on the board. Add it the way `file-issue` does. If it is already In Progress, ask whether to continue the existing branch. If it is in Planned, the issue body is the plan: follow it, and check the paths it cites against current code first.

3. **Cut a worktree and push its branch.** One task, one worktree, always, because another agent in the same checkout can move HEAD and put a commit on the wrong branch. Pick the prefix from the label: `enhancement` is `feat/`, `bug` is `fix/`, `documentation` is `docs/`, anything else is `chore/`. Build the slug from the title, in lowercase kebab-case, at most 30 characters.

   ```sh
   git fetch origin
   git worktree add -b <prefix>/<slug> ../resume-builder-<slug> origin/main
   git -C ../resume-builder-<slug> push -u origin <prefix>/<slug>
   ```

   All work happens inside that worktree. It starts with no `node_modules`, so run `bun install --frozen-lockfile` there. The primary checkout stays on `main` and is not edited.

4. **Move the card to In Progress.** Run this as one shell invocation, because sourced variables do not survive between tool calls.

   ```sh
   source .claude/gh-ids.env
   gh project item-edit --project-id "$PROJECT_ID" --id <item id from step 2> \
     --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_IN_PROGRESS"
   ```

5. **Open a draft PR at the first commit.** GitHub refuses a PR with no diff, so open it right after the first real commit and no later. It is the running record of the change, and it also gets a preview at `pr-<number>-resume-builder.pilotrun.app`.

   ```sh
   gh pr create --base main --head <prefix>/<slug> --draft --assignee vivek7405 \
     --title "<imperative summary>" --body-file <scratch>/pr-body.md
   ```

   The body starts with `Closes #<N>`. Use a plain `#<N>` if the PR only partly addresses the issue. Fill in `.github/pull_request_template.md`.

6. **Report** the issue, the branch, the worktree path, and the draft PR link, then do the work.

## While working

- Commit per logical unit and push after each commit. Imperative subject under 72 characters, a body that gives the reason, and no AI attribution.
- Post context comments on the PR as the work happens. See the next section.
- CI is GitHub Actions. Run only the check you are working on locally, by its title in `webjs.ci`: `bun run ci -- --only "Tests: server"`. The PR runs the rest, and `gh pr checks` shows the result.

## Context comments on the PR

A complete PR carries three things: a meaningful title, a body that says what changed and why, and context comments. The PR is the durable memory a future agent or the owner consults. The diff shows what changed, and the reasoning is lost with the chat unless it is written onto the PR.

**Post them automatically, as the discussion happens.** Nobody has to ask. Whenever the work or a conversation about it produces something the diff does not explain, post it then: why an approach won over a credible alternative, an experiment tried and reverted, a tradeoff accepted knowingly, a constraint discovered mid-work, something deliberately deferred, a review finding resolved a particular way. This runs across the PR's whole life, so do not save it for one dump at the end.

```sh
gh pr comment <N> --body-file <scratch>/pr-comment.md
```

Use an inline review comment instead when the reasoning belongs to specific lines.

**The test.** Someone who opens only this PR, with no access to the chat, should find every non-obvious "why" already written there. If reconstructing the reasoning would take the chat transcript, a comment is missing. Skip what the diff already makes obvious, and do not repeat the PR body.

**The shape.** Start each standalone comment with a short bold heading that names its kind and subject, such as `**Decision: kept SQLite over Postgres for the volume**`, so the comment list can be scanned. Replies inside a review thread need no heading. Write in the owner's voice: first person, plain, no AI or agent framing. Link commits as [`5fd02dc`](https://github.com/vivek7405/resume-builder/commit/5fd02dc), because GitHub does not link a SHA inside a code span. Keep to the prose rule in `.agents/rules/workflow.md`.

**What stays off the PR.** A PR holds the code change and its review, nothing about the session that produced them. Leave out a subagent that failed, a tool error, a retry, an interruption, how long something took, and your own process mistakes. CI results and test counts belong in the body's test plan, not in comments. The test: would this still matter to someone reading the PR in a year? A rejected alternative passes. "I got this wrong earlier and then corrected it" does not, since the diff already shows the correction.

## Definition of done

The gate for `gh pr ready <N>`. For each item, do it or write "N/A because <reason>" in the PR body.

1. **Tests at every layer the change can affect.** Server in `test/<feature>/*.test.ts`, browser in `test/<feature>/browser/*.test.js`, e2e in `test/<feature>/e2e/`. A unit test passing does not prove client behaviour. Show the new test can fail: commit the fix and the test first, break the source, watch it go red, then restore it. Commit first because `git checkout <file>` on an uncommitted fix throws the fix away with the breakage. Break the source with an edit rather than `sed`, since shell-quoted escapes can leave control bytes in the file. If a later commit touches the same mechanism, run it again, because a test that failed for an older commit may no longer catch anything.
2. **Docs on the same PR.** Use `doc-sync`. Note that `app/(app)/architecture/` describes the code and has to move with it.
3. **The browser, for UI work.** Boot `bun --bun run dev`, open every changed route, and play through its states. `check` and `typecheck` pass even when a layout collapses.
4. **Context comments.** Every non-obvious "why" is on the PR, by the test in the section above. The last thing to check before going ready, since a PR with no comments and real decisions in it is incomplete.
5. **All seven checks green on the pushed head.**

Then run `gh pr ready <N>` and hand it to the owner. There is no review cycle to run: no reviewer subagents and no self-authored review objects. The owner reviews every PR.

## Review

**If the owner asks you to review a PR,** do it yourself, inline in the session, with the `pr-review` skill: one read over the whole diff, posted as one review object. Never hand it to a subagent or expand it into rounds. A plain review ask stops at the findings. If the ask says to fix them, apply the fixes, and if it also asks for comments, do both.

**When the owner leaves review comments,** work through each one:

1. **Fix it** on the branch, then commit and push. Or make the case in the thread for leaving it as is, and let the owner decide.
2. **Reply in the comment's thread** with the resolution, in the voice described under "Context comments on the PR". Build the payload with `jq --rawfile`.

   ```sh
   gh api -X POST repos/vivek7405/resume-builder/pulls/<N>/comments/<comment_id>/replies \
     --input <scratch>/reply.json
   ```

3. **Resolve the thread** once its finding is fixed, or once the owner has decided not to fix it and your reply records that. A thread stays open only while the owner has not decided. Threads resolve only through GraphQL, with the commands under "Merging".

## Merging

Merge only when the user explicitly says to, and ask whether to delete the branch if they did not say. Branch protection on `main` requires seven checks, admins included, and no review: `Conventions`, `Health`, `Types`, `Security: dependency audit`, `Tests: server`, `Tests: browser`, `Tests: e2e`. A red check is read and fixed, or reported. It is never bypassed.

**Close out every review thread first.** A merge instruction does not mean the threads can stay open, and GitHub will not stop you, because `main` does not require it. List what is unresolved, including threads from a `/code-review --comment` run:

```sh
gh api graphql -f query='query{repository(owner:"vivek7405",name:"resume-builder"){pullRequest(number:<N>){reviewThreads(first:50){nodes{id isResolved path line comments(first:1){nodes{databaseId body}}}}}}}' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)'
```

For each one, reply with what was decided and why, including when the owner said not to fix it, then resolve it:

```sh
gh api -X POST repos/vivek7405/resume-builder/pulls/<N>/comments/<comment_id>/replies --input <scratch>/reply.json
gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -f t=<thread id>
```

If the owner has not decided on a finding, ask, and hold the merge until they do.

Then run these from the primary checkout, with the full head SHA, since the guard refuses a short one:

```sh
gh pr merge <N> --merge --match-head-commit <full sha>
git push origin --delete <prefix>/<slug>
git worktree remove ../resume-builder-<slug>
git branch -d <prefix>/<slug>
```

This repo uses merge commits. Delete the branch as its own step, because `--delete-branch` also tries the local branch, which fails while a worktree has it checked out. `.claude/hooks/cleanup-merged-worktree.sh` sweeps other merged worktrees that are clean.

## After a merge

- **Check the card reached Done.** Merging with `Closes #<N>` closes the issue, and the board's `Item closed` automation moves the card within seconds, so there is nothing to do by hand when it works. Read it to confirm:

  ```sh
  gh api graphql -f query='query($n:Int!){repository(owner:"vivek7405",name:"resume-builder"){
    issue(number:$n){state projectItems(first:5){nodes{id project{number}
    fieldValueByName(name:"Status"){...on ProjectV2ItemFieldSingleSelectValue{name}}}}}}}' \
    -F n=<N> --jq '.data.repository.issue | [.state, (.projectItems.nodes[] | select(.project.number == 15) | .fieldValueByName.name)] | @tsv'
  ```

  If it is not Done, tell the user the automation missed it, then set it:

  ```sh
  source .claude/gh-ids.env
  gh project item-edit --project-id "$PROJECT_ID" --id <item id> \
    --field-id "$STATUS_FIELD_ID" --single-select-option-id "$STATUS_DONE"
  ```

- **A merge is a production deploy.** Pilots autodeploys `main` to https://resume-builder.pilotrun.app. Read the deploy status on the merge commit, then load the site:

  ```sh
  gh api repos/vivek7405/resume-builder/commits/<sha>/status --jq '.statuses[]|[.context,.state,.description]|@tsv'
  ```

  If the deploy fails, use the `pilots` skill to read why. A rollback changes what is live, so it needs the user's agreement.

- **Read the checks on the merge commit too**, since they run again on `main`. A failure there is reported, not ignored.

## Failure handling

- A dirty task worktree at the start means a prior session stopped mid-work. Ask before touching it. A dirty primary checkout is not a blocker, because the worktree cuts from `origin/main`.
- A commit that landed on the wrong branch means something moved HEAD. Confirm with `git branch --show-current` before every commit.
- If the task worktree's HEAD is detached or off its branch and work seems gone, do not redo it or force-push. Every unit was pushed, so the branch still has it. Run `git -C <worktree> checkout <branch>`, then confirm with `git log --oneline origin/main..HEAD` and a clean `git status`.
- If the card move fails, report it and continue. The branch still stands.
