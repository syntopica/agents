---
name: brp-todo-work
description:
  Executes a project's existing TODO backlog end to end until every safe item is
  verified complete, blocked with evidence, or superseded. Trigger when the task
  is to work through TODO.md, clear the backlog, or resume autonomous TODO
  execution in the current repository, recording closed work in TODO_LOG.md. Do
  not use for building a backlog from conversation history, for a single named
  bug fix or feature, or for review of already-finished work.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, TodoWrite, Task
argument-hint: [scope-or-category]
---

## Rules

- Scope is the current repository and its project-owned TODO files. The primary
  backlog is the root `TODO.md`; nested TODO files apply when their subproject
  is in scope. English in every artifact.
- Cross-project discoveries are the one exception to repository scope: work that
  belongs to another project is filed in that project's own `TODO.md` as a
  bookkeeping write with an evidence pointer, never executed from this run. When
  the target repository is not accessible, record it in the current `TODO.md`
  under a `Cross-project` category marked with the target repository.
- No commit, push, branch, or PR unless the user or project instructions
  authorize it. A standing authorization already on record - in the repository's
  instructions, the user's own instruction files, or project memory - is that
  authorization when its recorded scope covers the action at hand: same
  repository, same kind of action, same branch or remote. Read those before
  parking work as needing authority, and do not re-ask per run for permission
  whose scope plainly still applies. A one-off approval, or a record whose scope
  is unclear, has expired and does not carry to a different target.
- Do not stop after one task or one iteration while safe actionable work
  remains. Recover prior context from project memory, current files, Git
  history, and existing plans before asking the user to restate it.
- A turn ends when the run does, not when a report is ready. Never close a turn
  on "next I will", "continuing with X", or a named remaining item: if the next
  action is known and safe, take it in the same turn. Status belongs in a brief
  note between tool calls, and a checkpoint states what happened and proceeds -
  it never offers the user a menu of what to do next.
- Authority list, and the only reason to interrupt the user mid-run: an action
  that is destructive, irreversible, production-affecting, credential-bound, an
  external communication, a change to a recurring automation or remote trigger,
  or a consumer of paid or quota-limited resources. This list overrides the
  decide-by-default rule below wherever the two meet.
- Hosted CI runs, cloud builds, paid API or model calls, bulk backfills, and
  scheduled jobs are external side effects. Discover existing budget and
  operating constraints before using them; do not enable a disabled workflow,
  increase its frequency, or trigger it merely to validate a change unless that
  exact remote cost is already authorized. Prefer equivalent local validation
  when a remote gate is disabled, exhausted, rate-limited, or expensive, and
  record the missing remote proof honestly instead of spending quota or claiming
  it passed.
- Never put secret values or personal data in TODO notes, logs, commits, or
  chat; use safe references to the approved secret store.
- Fix root causes in the owning source, not with suppressions, skipped checks,
  or local patches.
- Preserve unrelated changes in a dirty worktree. Do not edit an existing
  migration without confirmation.
- Do not deploy, write production data, delete important data, rotate
  credentials, bypass security controls, rewrite shared history, or send
  external messages without the required authority. Prepare the safe patch or
  exact next action when possible, then continue with unrelated safe work.
- `[x]` requires a command result or equivalent external evidence, never a
  reading of the diff.

## Approval gate

Reconstruction and read-only inspection need no approval. Stop before the first
write and write the plan into the conversation as ordinary visible text, not
only into a question widget or a todo list: an approval prompt shows its
options, so a plan that lives only inside it asks the user to approve something
they never read. The plan is one line per item to execute (task, intended
outcome, validation), the excluded items with their reason, anything needing new
authority, an honest estimate of scale (items and files or systems touched), and
the declared caps below. Only then ask to approve, approve with changes, or
decline, and keep the request itself to one sentence.

Approved with changes restates the queue once and starts; declined stops without
changing anything. The approval covers the listed items and the narrow
dependencies they cannot be completed without - not the backlog at large. Newly
discovered peer work goes into `TODO.md` for the next plan unless the user
approved an explicit wildcard ("everything actionable"). Within that boundary
the approval lasts the whole run: finishing an item, a wave, or the presented
queue while approved work remains is not a reason to come back, and only an
action needing authority the run does not have sends you back to the user.

Name Codex in the plan when the run intends to use it, with a cap on calls, so
the separate quota is approved with everything else rather than spent silently.

A run-scoped waiver ("execute without asking") skips this gate but never covers
actions that independently require authority.

## Deciding instead of asking

Default to deciding whatever preserves observable behaviour and public
contracts: a missing technical detail, two defensible implementations of the
same result, an arguable task state. Take the most reasonable reading, prefer
the reversible option, and record the assumption next to the item.

Ambiguity about what the product should do is not that kind of decision. When
the fork changes behaviour a user or a caller would notice - a default, an API
or data contract, what a number means, or which of two materially different
outcomes the backlog wants - a wrong choice is cheap to revert in Git and
expensive everywhere else. Park those, and keep the authority list above ahead
of everything in this section.

Delegate the genuine forks to Codex rather than to the user. Batch a wave's open
decisions into one brief, run one read-only `codex exec` with a JSON schema, act
on the verdict, and log the decision with the item it unblocked. Codex bills a
separate quota, so an adjudication is cheaper than a round trip through the
human and far cheaper than a stalled run. Load
`references/codex-adjudication.md` for the brief, the schema, the exact command,
and how to handle a malformed or low-confidence verdict.

Questions that genuinely need the user do not stop the run: park the item `[!]`
with the exact question, continue with everything else, and deliver every
accumulated question in one block in the final report.

Codex is a working partner for the whole run, not only its adjudicator: it takes
the heavy independent implementation, and it reviews finished waves as a second
model that never saw this session - the role it is best at, and the one that
catches what a self-review cannot. Pairing this way is the default posture of a
backlog run and needs no separate request.

## Caps

Declare all four in the plan and stop when any is hit, reporting a checkpointed
incomplete run:

- iteration count, token budget, and wall time;
- no-progress: two consecutive waves closing no item and producing no new
  evidence.

Flaky checks get exactly one retry, so noise does not read as divergence.

## Workflow

1. Reconstruct the current state. Read applicable instruction files,
   `git status`, recent history, active plans, reports, and validation scripts,
   and every project-owned `TODO.md`, `TODO_LOG.md`, `TODO_HISTORY_INDEX.jsonl`.
   Ignore vendor and generated files. Determine which TODO is primary and which
   are scoped plans. With no project-owned TODO, stop and recommend
   `brp-todo-create`.
2. When consulting conversation history, reuse the index instead of reparsing:
   look up each conversation in `TODO_HISTORY_INDEX.jsonl` by `source` +
   `conversation_id`; skip unchanged `complete` and `irrelevant` records; read
   only content after `reviewed_through` when a reliable cursor exists; retry
   `partial` or `inaccessible` records only when their source or access changed;
   update a record only after its findings are reconciled into `TODO.md` or
   `TODO_LOG.md`; never store message content or secrets in the index.
3. Build the execution queue. Verify each task's real state rather than trusting
   its marker. Track in the plan mechanism, per item: wording and source
   location, verified state, dependencies and affected files, validation method,
   risk and external side effects, and whether independent execution is safe.
   Order the queue: broken foundations and blockers, security and data
   integrity, correctness bugs, missing validation, improvements, documentation,
   speculative ideas last. Respect declared project priorities; do not promote a
   low-value item ahead of them merely because it is easy. Give every remaining
   `[ ]` and `[~]` one disposition: execute now, blocked by a named condition,
   waiting for authority, or out of scope. "Large", "low ROI" and "future" are
   not terminal conditions.
4. Get the plan approved, then execute item by item: inspect the current
   implementation and relevant history before editing; state a testable
   completion condition; implement the smallest complete production-quality
   change that satisfies the original intent; add tests when the risk warrants
   them; run targeted validation before broad project checks; review the final
   diff for regressions, duplication, dead code, accidental formatting churn,
   and scope creep.
5. When work is already complete, do not redo it: verify it and move it to the
   log with concise evidence. When a better implementation supersedes it, name
   the replacement and log the original as `[-]`. When blocked, exhaust safe
   in-scope alternatives, record the exact blocker and smallest unblock action,
   and continue elsewhere.
6. Checkpoint after each item or dependency wave: record the verified result or
   truthful partial state in `TODO.md` and `TODO_LOG.md` with compact evidence,
   inspect the focused diff and `git status`, and re-read the queue and any
   newer user direction before choosing the next item. A checkpoint is what
   makes a long run resumable, not a reason to stop while safe actionable work
   remains. Include the bookkeeping in the same logical change as the
   implementation when publication is authorized; when commits are authorized,
   prefer one logical commit per change and the fewest coherent pushes, never a
   push per bookkeeping edit.
7. Delegate only independent, bounded tasks with non-overlapping file ownership;
   keep dependency chains sequential. Shared state files, commits and pushes
   stay with the coordinator. Require each result to name inspected and changed
   files, validation run, outcome, risks, and the proposed TODO update; inspect
   the diff and validation evidence before accepting it. If delegated work
   stalls or returns incomplete evidence, preserve useful output, mark the task
   truthfully, and reassess in the coordinator instead of relaunching unchanged.
8. Route delegated heavy work to the cheapest capable capacity whenever
   possible: Codex CLI on its own OpenAI quota, Antigravity (Gemini quota, plus
   separate Claude and ChatGPT quotas), or cheaper Claude models (Haiku or
   Sonnet subagents). Reserve the main session's model for coordination and
   result verification. Codex implementation runs take a written brief and
   `-s workspace-write` scoped to the files the item owns; the same
   `references/codex-adjudication.md` covers the flags that exist in the
   installed CLI and the ones that no longer do.

## Output

- Return: items verified already complete, completed this run, advanced or
  superseded, blockers with their smallest unblock action, validation commands
  and results including pre-existing failures, `TODO_LOG.md` entries added,
  history-index records reused, added, or updated when history was consulted,
  files changed, cross-project items filed with their target repositories,
  remote or metered actions taken or still needing approval, decisions
  adjudicated by Codex with the option chosen, every question parked for the
  user in one block, and tokens spent per completed item.
- State the remaining `[ ]`, `[~]` and `[!]` counts, and for each remaining
  `[ ]` or `[~]` the concrete reason it could not be advanced. Size, elapsed
  time, context pressure or a preference for a fresh session make a task neither
  complete nor out of scope: report a checkpointed incomplete run instead. Never
  mark remaining work complete to make the run appear finished; if the
  environment forces a handoff while an item remains actionable, report a
  checkpointed incomplete run.
- Load `references/todo-formats.md` for the state legend and the `TODO_LOG.md`
  entry shape.
