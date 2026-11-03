---
name: research-record
description: Record a research, design, or decision investigation for resume-builder as a closed GitHub issue labeled research. Use when the deliverable is a writeup with no code diff, such as "research whether X", "evaluate X vs Y", "decision record", "write up the design", or "spike X", while working in this repo. Replaces webjs-research-record here, which targets the webjs framework repo.
when_to_use: |
  Examples that should trigger this skill:
    "research whether we should move off SQLite"
    "evaluate puppeteer vs the browser's print dialog for PDFs"
    "write up the design for template theming"
    "spike PDF export and capture the findings"
  The implementation that follows is separate tracked work, filed with file-issue.
  Do NOT trigger for: filing an actionable task (file-issue), starting an existing issue (start-work), or a change that ships a real code diff (a normal PR).
---

# Record an investigation as a closed `research` issue

A research record is a GitHub issue labeled `research`, with the writeup in its body and threaded detail in comments, then closed. An issue suits a writeup with no diff, it is filterable by the label, and the question and its answer stay together.

## Where a record does not go

- Not a file in `.agents/skills/webjs/`, which teaches agents how to use the framework.
- Not the `/architecture` pages, which describe the code as it is. A decision's reasoning goes in a record, and the pages describe what shipped.
- Not a comment on an unrelated issue or PR, where it cannot be filtered or found.
- Not a PR, since there is nothing to merge. The one exception: if the research produced a spike worth showing, open a draft PR for that code and link it from the record. The writeup still lives in the issue, and the spike PR is closed unless it graduates into separate tracked work.

## Investigating

For several options or angles, spawn one read-only `Explore` agent per option in a single message, each returning evidence with file paths and citations. Synthesize the results yourself, because the conclusions are yours and not a vote. A single-question spike needs no fan-out.

## Two ways in, same destination

- **No issue exists yet:** create the labeled issue with the writeup, then close it.
- **An open `research` issue already asks this question:** put the investigation thread (options weighed, dead ends, reversals) in comments, curate the conclusion into the body, then close it.

## Steps

1. **Make sure the label exists.**

   ```sh
   gh api "repos/vivek7405/resume-builder/labels?per_page=100" --jq '[.[].name] | index("research")'
   # if that prints null:
   gh label create research --repo vivek7405/resume-builder --color 5319e7 \
     --description "Research, design, or decision record with no code"
   ```

2. **Create the issue, or update the existing one.** The title starts with `research:`. The body has the question, the options compared, the decision and its reasoning, and any reversal between what was recommended and what shipped. Build payloads with `jq --rawfile`, so backticks and `$` never reach the shell.

   ```sh
   jq -n --rawfile b <scratch>/record.md \
     '{title:"research: <question or decision>", body:$b, labels:["research"], assignees:["vivek7405"]}' > <scratch>/rec.json
   gh api -X POST repos/vivek7405/resume-builder/issues --input <scratch>/rec.json --jq '"\(.number) \(.html_url)"'

   # or, for an existing issue:
   jq -n --rawfile b <scratch>/record.md '{body:$b}' > <scratch>/rec-body.json
   gh api -X PATCH repos/vivek7405/resume-builder/issues/<N> --input <scratch>/rec-body.json --jq .number
   gh api -X POST repos/vivek7405/resume-builder/issues/<N>/labels -f 'labels[]=research' --jq '[.[].name]|join(",")'
   ```

3. **Add deep-dive comments** for threaded detail.

   ```sh
   jq -n --rawfile b <scratch>/deep-dive.md '{body:$b}' > <scratch>/rec-comment.json
   gh api -X POST repos/vivek7405/resume-builder/issues/<N>/comments --input <scratch>/rec-comment.json --jq .html_url
   ```

4. **Close it as completed.** It is a record, not open work.

   ```sh
   gh api -X PATCH repos/vivek7405/resume-builder/issues/<N> -f state=closed -f state_reason=completed \
     --jq '"\(.state)/\(.state_reason)"'
   ```

5. **Report** the number and confirm the label.

## After the record

Implementation is separate. File it with `file-issue`, so the "why" and the "what to build" stay as distinct issues.

## Finding records

```sh
gh api "repos/vivek7405/resume-builder/issues?labels=research&state=all&per_page=100" \
  --jq '.[] | select(has("pull_request") | not) | "#\(.number) \(.title)"'
```

The `pull_request` filter is needed because this endpoint returns PRs alongside issues.
