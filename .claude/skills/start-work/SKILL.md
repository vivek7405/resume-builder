---
name: start-work
description: Start work on a tracked issue in the resume-builder repo. Use when the user says "work on #12", "start issue 12", "pick up #12", "tackle the export issue", or begins any code change while working in this repo. Replaces webjs-start-work here, which targets the webjs framework repo. Cuts a dedicated worktree and branch from origin/main, moves the card to In Progress, opens a draft PR early, and carries the definition of done and the merge rules.
when_to_use: |
  Examples that should trigger this skill:
    "work on #12"
    "start work on issue 12"
    "pick up #12"
    "let's work on the export issue"
  Also use right after file-issue, before writing code for new work that had no issue. The standing rule is no code before a tracked issue and a branch cut for it.
  Do NOT trigger for: listing what is open (list-todos), or filing a new issue (file-issue).
---

# Start work on a resume-builder issue

## Precondition: the work has a tracked issue

If there is no issue for this work, stop, run `file-issue`, then come back with the number. Untracked work never shows on the board and its PR closes nothing.

If the user described the issue by topic, resolve the number:

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

   An empty result means it is not on the board. Add it the way `file-issue` does. If it is already In Progress, ask whether to continue the existing branch.

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
- Put a decision the diff does not explain on the PR as a comment when it happens: an alternative rejected, a tradeoff accepted, a constraint discovered. Keep session mechanics (retries, tool errors) off the PR.
- CI is GitHub Actions. Run only the check you are working on locally, by its title in `webjs.ci`: `bun run ci -- --only "Tests: server"`. The PR runs the rest, and `gh pr checks` shows the result.

## Definition of done

The gate for `gh pr ready <N>`. For each item, do it or write "N/A because <reason>" in the PR body.

1. **Tests at every layer the change can affect.** Server in `test/<feature>/*.test.ts`, browser in `test/<feature>/browser/*.test.js`, e2e in `test/<feature>/e2e/`. A unit test passing does not prove client behaviour. Show the new test can fail: commit the fix and the test first, break the source, watch it go red, then restore it.
2. **Docs on the same PR.** Use `doc-sync`. Note that `app/(app)/architecture/` describes the code and has to move with it.
3. **The browser, for UI work.** Boot `bun --bun run dev`, open every changed route, and play through its states. `check` and `typecheck` pass even when a layout collapses.
4. **All seven checks green on the pushed head.**

Then run `gh pr ready <N>` and hand it to the owner. There is no review cycle to run: no reviewer subagents and no self-authored review objects. The owner reviews every PR.

## Merging

Merge only when the user explicitly says to, and ask whether to delete the branch if they did not say. Branch protection on `main` requires seven checks, admins included, and no review: `Conventions`, `Health`, `Types`, `Security: dependency audit`, `Tests: server`, `Tests: browser`, `Tests: e2e`. A red check is read and fixed, or reported. It is never bypassed.

Run these from the primary checkout, with the full head SHA, since the guard refuses a short one:

```sh
gh pr merge <N> --merge --match-head-commit <full sha>
git push origin --delete <prefix>/<slug>
git worktree remove ../resume-builder-<slug>
git branch -d <prefix>/<slug>
```

This repo uses merge commits. Delete the branch as its own step, because `--delete-branch` also tries the local branch, which fails while a worktree has it checked out. `.claude/hooks/cleanup-merged-worktree.sh` sweeps other merged worktrees that are clean.

## After a merge

- **Set the card to Done.** Merging closes the issue but does not move the card on this board.

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
- If the card move fails, report it and continue. The branch still stands.
