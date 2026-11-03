---
name: list-todos
description: List open work on the Resume Builder board. Use when the user asks what is open, what is pending, what is in progress, what is on the board, or what to work on next, while working in this repo. Replaces webjs-list-todos here, which reads the webjs framework board.
when_to_use: |
  Examples that should trigger this skill:
    "what's open"
    "what's pending"
    "list todos"
    "what should I work on"
    "what's on the board"
  Do NOT trigger for: starting a specific issue (start-work) or filing a new one (file-issue).
---

# List open work on the Resume Builder board

The board at https://github.com/users/vivek7405/projects/15 is the source of truth, so read it from GitHub rather than from memory or an internal task list.

## Steps

1. **Fetch the board once and reuse the result.**

   ```sh
   gh project item-list 15 --owner vivek7405 --format json --limit 1000 \
     --jq '.items[] | [.status, .content.number, .title] | @tsv'
   ```

   Pass `--limit`, because the default page is 30 and a larger board would silently truncate.

2. **Bucket by Status:** Todo, Planned, In Progress, Done. A card with no status goes in its own "No status" bucket, so it does not disappear.

3. **Show** Todo, Planned, In Progress, and any No status cards. Show Done only if the user asks for it or if everything else is empty. If the user asked for one bucket, show that one.

4. **For each item,** show `#<number>  <title>`.

```
Todo:
  #12  Add PDF export

Planned:
  (none)

In Progress:
  (none)
```

If the board is empty, say so.

## What this skill does not do

It does not move cards, file issues, or open PRs, and it does not show closed issues that are not on the board.

## Failure handling

If `gh` returns an auth error, show it and suggest `gh auth refresh -s project`, which the user runs.
