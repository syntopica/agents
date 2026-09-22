# TODO and log formats

## State legend

Add it to `TODO.md` when absent:

- `[ ]` pending
- `[~]` in progress, partially complete, or implemented but not validated
- `[!]` blocked by a named condition
- `[x]` verified complete
- `[-]` obsolete or superseded by a named replacement

Mark `[~]` as soon as work lands without completion evidence. Keep `[!]` in
`TODO.md` with the exact blocker and the smallest unblock action. Mark `[x]`
only when implementation, validation and intent agree. Use `[-]` only when the
original task is no longer valid, and name why. Merge duplicates and update
stale wording in place. Closed entries do not accumulate in the active backlog.

## `TODO.md` header

```md
# TODO

> Consolidated from the accessible Claude, Codex, Cursor, and Antigravity
> project history. Last reviewed: YYYY-MM-DD. History coverage: Complete |
> Partial.
>
> States: `[ ]` pending · `[~]` partial or unverified · `[!]` blocked · `[x]`
> verified complete · `[-]` obsolete or superseded. Closed work moves to
> `TODO_LOG.md`.
```

For partial coverage add one short sentence naming what was unavailable. No
executive summary.

## `TODO_LOG.md`

One entry per task or tightly related group, grouped by year and month, in a
single root file:

```md
# TODO Log

> Searchable record of closed project work. Active work lives in `TODO.md`.

## 2026

### 2026-07

- [x] 2026-07-23 — **Backend:** Prevent duplicate message records.
  - Result: Added an idempotent insert boundary.
  - Evidence: `pnpm test -- message-persistence`; commit or PR when available.
  - Files: `src/messages/insertMessage.ts`, `test/message-persistence.test.ts`.

- [-] 2026-07-23 — **Infrastructure:** Replace Redis with PostgreSQL.
  - Resolution: Superseded by the accepted Redis retention decision in ADR-12.
```

Evidence is a test name, command result, commit, PR, issue or report reference,
not a transcript. Treat the log as append-only history: correct material
mistakes with an explicit amendment rather than rewriting past evidence. Archive
only complete old years under `docs/todo-log/YYYY.md` if the file becomes
unwieldy, and never split more granularly than one file per year.

## When a backlog moves to the repository that owns it

The log follows the backlog. A backlog that moves out of a meta repository into
the repository that owns the work leaves its closed history behind, and a
pointer in the old log is not enough: the next reader of the owning repository
searches its own `TODO_LOG.md` before asking, finds nothing, and reopens work
that was closed months ago. Move the history too, verbatim, in one pass, and
leave a dated note in the old log saying where it went.

Verbatim means verbatim. Past entries are evidence, so a migration re-homes them
and adjusts nothing else: heading levels shift to fit the new file's structure
and the prose stays as it was written, even where older entries are prose
sections and newer ones are `- [x]` bullets. Say so in the new log's header
rather than rewriting them into one shape. Measured 2026-09-22 moving 841 lines
of DMX history out of `~/p/TODO_LOG.md` into `DMX-Fixtures/`, a month after that
backlog had moved.

## Prettier will not converge on a nested list inside an indented item

A repository whose format gate runs Prettier over Markdown can enter a loop that
looks like a broken hook. Writing a `-` sub-list inside a continuation paragraph
of a `- [ ]` item makes Prettier indent that sub-list further on every run: the
file is rewritten, `--check` still fails, `--write` deepens it again, and no
number of retries converges. Measured 2026-09-08 in `busirocket`, where a commit
failed three times before the cause was clear.

Write the detail as **continuation paragraphs**, not nested bullets. A TODO
entry carrying several findings reads at least as well as prose, and the format
gate passes on the first attempt:

```markdown
- [ ] **The headline claim.** The measurement and where it came from.

  The second finding as its own paragraph, indented two spaces to stay inside
  the item.

  The third, likewise. No `-` bullets at this level.
```

If a nested list already exists and Prettier is looping, restore the file from
the last commit before rewriting - `git checkout <file>` restores from the
**index**, so a mangled version that was already `git add`ed comes straight
back; use `git checkout HEAD -- <file>`.
