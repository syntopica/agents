---
name: brain
description:
  Answers from the personal LLM-wiki at ~/p/wiki, ingests sources into it, and
  audits its health with the repository's own tooling. Trigger when a task needs
  durable context that sounds previously established (a project's setup, a
  client, a past decision, infra, a credential), when new material has to be
  folded into the wiki, or when the wiki's health is in question. Triggers (ES)
  are ingerir, ingestar contenido, guarda en brain, mete en brain. Do not use
  for a repository that merely contains markdown, for code changes to the
  brain's own tools, or for memory-palace recall, which is a different store.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

## Rules

- **The brain is private and holds live credentials inline.** Never print a
  secret into chat, a commit message, a PR, or any file outside the repository.
  Reading one to use it is the point; echoing it is not.
- **Read before asking.** A question whose answer sounds previously established
  is answered from the wiki, not from the user. `~/p/wiki/brain/index.md` is the
  entry point and every page cross-links.
- `SCHEMA.md` governs page layout, frontmatter, folder placement and secret
  handling, and `CLAUDE.md` governs the ingest runbook and the several-sessions
  rule. Read both before writing a page; neither is summarised here, because a
  copy would drift.
- **Several sessions use this repo at once.** A commit you did not make, a page
  you did not touch showing up modified, and a `main` that has moved are all
  ordinary. `git log --oneline -5` and `git status` answer it in one call. Never
  report it as loss and never restore on that basis.
- **Never `git add -A`.** Stage your own paths. Sweeping another session's work
  into your commit is the one thing this repository forbids by name.
- Run `pnpm exec prettier --write` on every `.md` you touched before committing.
  An unformatted page on `main` turns `pnpm run check` red for every other
  session.
- Push what you commit, promptly: an unpushed commit blocks every other
  session's ingest.

## Query

Answer from the wiki before reaching for the source material it was compiled
from.

1. Start at `index.md`, follow `[[links]]`. The map is generated from each
   page's `summary:`, so it is current.
2. `grep` is for strings the wiki does not index - a credential value, a
   hostname, a filename. Following links beats grepping for a topic, which is
   the whole point of the pattern.
3. `python3 tools/graph/build.py` prints related-but-unlinked pairs when the
   obvious page is thin.

If the answer is not there, say so and offer to ingest the source that would put
it there.

## Ingest

```bash
pnpm --dir tools/clips clips status              # what is captured and where it stands
pnpm --dir tools/clips clips ingest --dry-run    # route only, reaches no prompt, costs nothing
```

A real run is `clips ingest`, and `--manual` selects the interactive
synthesizer - no model at all, the CLI opens a worktree and this session writes
the pages into it. **The full FIFO runbook is in `~/p/wiki/CLAUDE.md`; follow it
there rather than improvising**, because the command prompts twice and a piped
answer sends EOF before the pages exist.

Two mechanics that cost a re-run when forgotten, both from that runbook:

- **Everything must be written before answering the synthesizer prompt.**
  Validation runs between the two prompts and its result is the path set the
  committer may stage, so a file first touched at the review gate is silently
  not committed.
- Reviewing at the gate is fine; editing there is not. To change something,
  answer `s`, fix it, and re-run the clip.

A page nothing else links to is refused at the gate. Write the cross-link while
writing the page.

## Lint

```bash
pnpm --dir tools/clips clips audit               # source drift, unresolved citations, stale pages,
                                                 # contradictions, quote grounding, claim refs
python3 tools/index/build.py --check             # the root map against the pages' own summaries
python3 tools/graph/build.py                     # orphans, dangling links, unindexed pages
pnpm run check:ci                                # the gate: types, lint, tests, format, index, graph
```

`clips audit` exits 2 when it has anything to report, which is a finding to read
rather than a failure. Findings it cannot close itself - a declared
contradiction, a source that changed under a page - belong in `TODO.md` with the
measurement, not in a silent fix.

## Grade

```bash
pnpm --dir tools/clips clips grade --page <path>
```

A second model that never saw the synthesis reads the page against the clips it
cites and reports every claim the sources do not support. **The grader must not
resolve to the model that wrote the page**; the repository enforces the split in
code and will refuse rather than grade if it cannot. Grade the pages a batch
touched, not the wiki - it spends quota per page.

## Model routing

Bulk passes that read a whole corpus go to Gemini through `agy`; the small
number of items where being right matters more than the price go to `codex` or
`agy`'s Anthropic and OpenAI models. The canonical wording is the
`## Model routing` section of `~/p/wiki/CLAUDE.md`. Read-only passes carry
`--sandbox --mode plan --disable-slash-commands`, never
`--dangerously-skip-permissions`: they inline untrusted captured text into a
session that can read live credentials.

## Output

Say which pages answered the question, which you changed, and which checks ran
with their results. An answer the wiki does not support is marked as
unsupported, not asserted.
