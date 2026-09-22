# Skill library and learning loop - design

Status: approved for planning, 2026-08-18.

## 1. Problem

A skill only helps if three things hold at once: it exists, the agent can see
it, and the agent picks it when the moment arrives. Measured over a month of one
instance's transcripts, all three fail in different places, and the failures are
not interchangeable.

- **It exists but nothing can see it.** One agent's skills directory holds a
  handful of symlinks to the skills this repository authors, while the bulk of
  the library reaches only another agent. Dozens of measured procedures have a
  genuine match sitting in that invisible set.
- **It is visible but the description does not convene it.** The most repeated
  procedure in the sample is covered by an existing skill whose description is
  written in vocabulary the request never uses, so a model reading the request
  never selects it. Several more cases behave the same way.
- **It does not exist.** A long tail of repeated procedures has no skill at all.

Underneath sits a curation problem. Most skills carry real provenance in the
library's lock file across a dozen upstream sources, but the library has exactly
one axis: present or absent. A couple of sources contribute most of the dead
weight - large stack-specific bundles against no codebase in that stack - and
everything present is fanned out to every IDE regardless of whether it earns the
slot.

And nothing learns. Each of the findings above took a manual mining pass to
discover. Next month the demand will have moved and no mechanism notices.

## 2. Scope

Build a curated skill and rule library with real provenance and four usability
states, plus a loop that observes actual usage, proposes changes, and applies a
narrow subset by itself.

**In scope:** the curation manifest, the update-with-local-patches model, the
observe/classify/ cross-reference/propose loop, trigger learning, and
enforcement of trigger quality by test.

**Out of scope:** replacing `skillkit`, which already installs and updates from
upstream and is kept as the fetch layer; replacing the multi-IDE linker, which
already fans out; and rewriting the skills themselves, which is separate work
the loop will propose.

## 3. Where it lives

The library is the private `BusiRocket/claude-skills` repo at `~/.agents`: it
already holds the skills, the lock, and the git history. The tooling and the
tests live in `agents-tools`, which is public and gains no third-party content.

This split also settles a licensing question that the `extracted` state raises.
Vendoring third-party skills into a private repo is one thing; copying a
fragment of one into a skill that ships from a public repo is another. Every
entry therefore records its upstream licence, and the `extracted` state records
which of our skills absorbed the fragment, so attribution survives the copy.

## 4. The four states

Every entry in the library is in exactly one state. This is the axis the library
lacks today.

| State       | Meaning                                                                   | On upstream update                                                                           |
| ----------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `adopted`   | used as-is, unmodified                                                    | applied directly                                                                             |
| `forked`    | we changed it and keep changing it                                        | our patch is reapplied over the new upstream; a conflict is reported, never silently dropped |
| `extracted` | only a fragment was useful, and it now lives inside one of our own skills | not applied; the entry records the fragment and the skill that absorbed it                   |
| `parked`    | not needed now, plausibly needed later                                    | fetched and updated, never fanned out to any IDE                                             |

`parked` is what makes a large library affordable: an entry stays current and
one command away without occupying a slot in any agent's catalogue.

Manifest at `~/.agents/curation.json`:

```json
{
  "version": 1,
  "entries": {
    "frontend-design": {
      "state": "adopted",
      "source": "anthropics/skills",
      "sourceUrl": "https://github.com/anthropics/skills.git",
      "skillPath": "skills/frontend-design/SKILL.md",
      "upstreamHash": "4aef6bcad51d058ec32b1acb9da436851863e56e",
      "licence": "unknown",
      "targets": ["claude", "codex", "antigravity"],
      "triggers": [
        "implement ui from screenshot",
        "implementar UI desde captura"
      ],
      "decidedAt": "2026-08-18",
      "reason": "24 measured requests over 30 days; nothing visible covers it"
    },
    "unit-test-service-layer": {
      "state": "parked",
      "source": "giuseppe-trisciuoglio/developer-kit",
      "reason": "Java/Spring only; no Spring codebase in ~/p"
    }
  }
}
```

`targets` is per entry, so a skill can be adopted for Codex and parked for
Claude without being two entries.

**Curation is declared, never enacted by deletion.** `~/.agents` travels by two
paths at once: git, where deletions propagate, and `sync-ai`, whose rsync
deliberately runs without `--delete` so that "nothing is ever deleted on either
side". A skill deleted here and committed reappears on the next sync from the
laptop. Any curation built on removing directories undoes itself silently; the
manifest is the authority, and the linker reads it.

## 5. Provenance and updating

`skillkit` stays the fetch layer. On top of it:

- The 8 entries with no provenance (`ckm-*` and our own `core` and
  `orchestrator`) get an origin recorded, ours pointing at `agents-tools` as
  their source of truth.
- `forked` entries store a patch under `~/.agents/patches/<name>.patch` together
  with the `upstreamHash` it applies to. Update fetches upstream, reapplies, and
  on failure leaves the working copy untouched and reports the conflict. A patch
  that no longer applies is a decision to make, not an error to swallow.
- Update never changes a state. Promotion and demotion are separate operations
  with their own approval.

## 6. The learning loop

Four stages, run on demand and on a schedule.

**Observe.** Read user turns from Claude transcripts and Codex rollouts.
Machine-written turns are excluded by pattern: the `security-guidance` Stop
hook's review prompt, `Stop hook feedback:`, `[structured-output-enforce]`, and
skill-loading preambles. This filter is not cosmetic - before it, code review
looked like 4.7% of all demand; after, 0.7%. Pasted screenshots are kept: a
screenshot is the request.

**Classify.** Each request becomes a task type, a domain, and a repeatable
procedure phrased consistently so identical procedures collapse when counted.
Bulk model work, batched, on the cheap tier. Incremental: a transcript already
processed and unchanged is skipped, tracked the way `TODO_HISTORY_INDEX.jsonl`
already tracks conversation coverage.

**Cross-reference.** For every procedure: which skill actually fired, and which
skill in the library covers it. That produces the three buckets the manual pass
produced - covered and fired, covered but unreachable, covered but
untriggerable - plus the uncovered remainder.

**Propose.** A dated report: promote these, fix the trigger wording of those,
build these, park the idle ones. Proposals carry their evidence - request
counts, projects spanned, and the phrasing that failed to select the skill.

## 7. Trigger learning

This is the part that makes the loop worth building rather than a report
generator.

Every successful invocation is preceded by a phrase that worked. Every uncovered
procedure with a matching skill is a phrase that failed. The first set becomes
candidate trigger phrases for the skill's description; the second becomes router
fixtures asserting that this phrasing must select that skill.

Descriptions stop being guesswork: 142 measured procedures already exist, in
both languages the work happens in.

Enforcement reuses what the repo has. `skills:lint` already runs
`DESCRIPTIONS_TEST.ts`, and the router already has fixtures. A new check
requires every `adopted` entry to carry at least one measured trigger phrase, so
a skill that nothing can convene fails the build instead of failing silently in
use.

## 8. Autonomy

The loop learns and proposes always. It applies exactly two things by itself:

1. **Adding measured trigger phrases to descriptions of our own skills.** Never
   to a vendored one - that would fight the updater.
2. **Moving an entry to `parked`** after a configured idle period with no
   invocation.

Promotion, forking, extraction, deletion and any edit to a third-party skill
require explicit approval. Every automatic action is written to a dated log in
the library, so an unwanted one is visible and revertible rather than
mysterious.

This is a starting policy chosen to be tested and corrected, not a final one.

## 9. Failure modes worth designing against

- **The classifier drifts.** Procedure phrasing must stay stable across runs or
  counts fragment. The prompt pins the wording style and the loop reuses
  previously seen procedure names as anchors.
- **The corpus lies.** Machine-injected turns already inflated one category
  sevenfold. New hooks will appear; the filter list is data in the library, not
  a constant in code, and unexplained volume spikes are reported rather than
  absorbed.
- **A promotion makes things worse.** Promotion is measurable: after promoting,
  the next run says whether the skill fired. A promotion that does not change
  invocation counts is a proposal to demote.
- **Costs.** The first full pass was 16 batched model calls over 2,467 requests.
  Incremental runs see only new transcripts, which is the difference between a
  weekly habit and a quarterly project.

## 10. Testing

- Turn extraction and the machine-noise filter get fixtures built from the real
  injected prompts found on 2026-08-18, asserting each is excluded and a real
  request beside it is kept.
- Manifest parsing and state transitions are pure and table-driven: every legal
  transition, every illegal one rejected with a reason.
- The patch reapplication path is tested for the conflict case specifically,
  asserting the working copy is left untouched.
- The linker is tested to fan out `adopted` and `forked` only, and to ignore
  `parked` and `extracted`.
- No test reads `$HOME`.

## 11. Open questions

- **Codex-side usage is unmeasured.** Its rollouts show the catalogue being
  listed into context rather than individual skills being opened, so "never
  fired" currently means "never fired in Claude". Either Codex gains a usable
  invocation signal, or proposals stay explicitly Claude-scoped.
- **Rules have no provenance at all.** The same four states apply to them, and
  nothing is instrumented yet. They are in scope for the library and out of
  scope for the first implementation.
- **The idle period before auto-parking** is a number to choose after one or two
  cycles of real data, not before.
