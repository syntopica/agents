# mattpocock/skills vs BRP - missing-moves diff (2026-08-13)

Source: shallow clone of `mattpocock/skills` compared against the BRP skill
family (`src/skills/orchestrator/brp` lanes, `src/skills/core/brp-docs`,
`src/skills/core/brp-code-quality`). Closes the TODO item "Diff
mattpocock/skills against the BRP equivalents for missing moves". Adoption
follow-ups live in `TODO.md`; this file is the evidence.

Note: `grill-with-docs/SKILL.md` is a 1-line delegator
(`Run a /grilling session, using the /domain-modeling skill`), so the real
payload read was `productivity/grilling/SKILL.md`,
`engineering/domain-modeling/SKILL.md` + `ADR-FORMAT.md` + `CONTEXT-FORMAT.md`.
Same for architecture, which delegates vocabulary to
`engineering/codebase-design/SKILL.md`.

## 1. grill-with-docs (grilling + domain-modeling)

Core mechanism: a design-tree interview run in rounds. The "frontier" is every
decision whose prerequisites are settled; the whole frontier is asked in one
numbered round, each question carrying a recommended answer, then it waits.
Facts are the agent's job (dispatch a sub-agent), decisions are the user's. Docs
are side effects written inline as decisions crystallize - glossary terms into
`CONTEXT.md`, real trade-offs into `docs/adr/`. Done only when the frontier is
empty and the user confirms.

Missing moves (BRP target: `src/skills/core/brp-docs/SKILL.md`, which is 31
lines and has zero ADR content despite advertising ADRs in its description; plus
`orchestrator/brp/references/brp-plan.md`):

| Move                                                                                                                                                                                                                                                                                                                                                                                                                           | Where it should land                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| The ADR bar (the TODO's "ADR bar" - confirmed absent). All three must be true or skip: hard to reverse, surprising without context, the result of a real trade-off. "If a decision is easy to reverse, skip it - you'll just reverse it."                                                                                                                                                                                      | new `brp-docs/references/adr-format.md`                             |
| ADR file convention: `docs/adr/NNNN-slug.md`, number = highest existing + 1, directory created lazily.                                                                                                                                                                                                                                                                                                                         | same                                                                |
| ADR template is radically minimal: title + 1-3 sentences of context/decision/why. "An ADR can be a single paragraph. The value is in recording that a decision was made and why - not in filling out sections." Status / Considered Options / Consequences are optional, only when they add value.                                                                                                                             | same                                                                |
| "What qualifies" catalogue: architectural shape, integration patterns between contexts, tech choices carrying lock-in ("not every library - just the ones that would take a quarter to swap out"), boundary/scope decisions incl. explicit no's, deliberate deviations from the obvious path, constraints not visible in code, non-obvious rejected alternatives.                                                              | same                                                                |
| `CONTEXT.md` glossary artifact + format. BRP has nothing on domain vocabulary (grep for glossary/CONTEXT.md/vocabulary across `src/` returns only the word "terminology" in brp-docs' own description). Format: term, 1-2 sentence definition of what it IS not what it does, plus an "Avoid:" list of banned synonyms. Rules: be opinionated, pick one word; only project-specific terms, never general programming concepts. | new `brp-docs/references/context-format.md`                         |
| Artifact scoping rule: "`CONTEXT.md` should be totally devoid of implementation details... It is a glossary and nothing else."                                                                                                                                                                                                                                                                                                 | same                                                                |
| Active domain-modeling moves during a session: challenge terms conflicting with the glossary ("your glossary defines cancellation as X, you seem to mean Y"); sharpen overloaded terms ("'account' - Customer or User?"); stress-test relationships with invented edge-case scenarios; cross-reference claims against code and surface contradictions.                                                                         | `brp-docs/SKILL.md` workflow + a line in `brp-plan.md`              |
| Write inline, never batch; create files lazily - capture the term the moment it resolves.                                                                                                                                                                                                                                                                                                                                      | `brp-docs/SKILL.md`                                                 |
| Grilling round protocol. `brp-plan.md` jumps straight to "read the current implementation" with no interview at all. Adoptable: frontier rounds, number each question with a recommended answer, questions depending on an open question belong to a later round, never ask the user anything you could look up yourself, don't block on a running sub-agent - ask the rest of the frontier now.                               | `brp/references/brp-plan.md` or new `references/grilling-rounds.md` |

Non-adoptable / duplicate:

- brp-docs' "run every runnable example before publishing it; an example that
  was never executed is a guess" is stronger than anything Matt has - keep.
- The emoji question format (question-mark and arrow glyphs) conflicts with
  BRP's ASCII text-hygiene rule; adopt the structure, not the glyphs.
- `CONTEXT-MAP.md` multi-context layout only pays off in monorepos; gate on
  BRP's existing monorepo detection.

## 2. tdd

Core mechanism: not a state machine - a set of quality bars consulted on every
cycle ("before and during the loop, not after"): what a good test is, seams as
the only legal test location, three named anti-patterns with tells, and four
loop rules. Its one hard gate is social: seams must be confirmed with the user
before any test is written.

Missing moves (BRP target: `brp/references/brp-test.md`, 25 lines, plus
`references/test-strategy-matrix.md`):

- Pre-agreed seams gate. "Before writing any test, write down the seams under
  test and confirm them with the user. No test is written at an unconfirmed
  seam." Rationale: you can't test everything; agreeing seams up front is how
  effort lands on critical paths instead of every edge case. BRP picks the layer
  unilaterally in step 2.
- Red-before-green ordering, at all. BRP's brp-test is explicitly post-hoc ("use
  when code exists and the next job is to prove correctness"). Missing: write
  the failing test first, then only enough code to pass it, don't anticipate
  future tests or add speculative features.
- Vertical slicing / ban on horizontal slicing. One test -> one implementation
  -> repeat, each test a "tracer bullet that responds to what the last cycle
  taught you". Named failure: writing all tests then all implementation verifies
  imagined behavior - you test the shape of things, tests go insensitive to real
  changes, and you commit to test structure before understanding the
  implementation.
- Three anti-patterns with their tells (BRP has none): implementation-coupled -
  tell is "breaks when you refactor but behavior hasn't changed"; tautological -
  the assertion recomputes the expected value the way the code does
  (`expect(add(a,b)).toBe(a+b)`), so it passes by construction; expected values
  must come from an independent source of truth (known-good literal, worked
  example, spec); side-channel verification - querying the DB to confirm
  `createUser` instead of calling `getUser`.
- Mocking policy. BRP says only "tests must be independent and deterministic".
  Missing: mock at system boundaries only (external APIs, DB sometimes,
  time/randomness, FS); never mock your own modules or internal collaborators;
  design for mockability via DI and SDK-style per-operation interfaces over one
  generic `fetch(endpoint, options)` so mocks need no conditional logic.
- "Refactoring is not part of the loop" - it belongs to review, not the
  red->green cycle.
- Test names as specification ("user can checkout with valid cart" - WHAT not
  HOW), one logical assertion per test.

Non-adoptable / duplicate:

- BRP's `test-strategy-matrix.md` (layer-by-change-type + explicit
  manual-verification fallback) is richer than Matt's; he has no manual
  fallback.
- "Every implementation MUST have validation commands, even if no test framework
  exists" - BRP-specific, stronger.
- BRP's SKILL.md deliberately delegates the TDD loop to
  `superpowers:test-driven-development`; the loop rules may belong there rather
  than duplicated - but the seam gate, anti-patterns and mocking policy are not
  covered by that delegation.

## 3. diagnosing-bugs

Core mechanism: a 6-phase state machine with hard gates and per-phase completion
checklists. Phase 1 (build a tight, red-capable feedback loop) is declared "the
skill" - everything else is "mechanical" - and you may not enter Phase 2 without
naming one command you have already run, showing its (redacted) output.
Confirmed: BRP has no equivalent state machine; `brp-debug.md` is 5 numbered
steps whose step 2 is "generate a hypothesis list", i.e. exactly the move Matt
gates against.

Missing moves (BRP target: `brp/references/brp-debug.md`, `brp-fix.md`,
`references/debug-investigation-template.md`):

1. The Phase-1 gate. "If you catch yourself reading code to build a theory
   before this command exists, stop - jumping straight to a hypothesis is the
   exact failure this skill prevents. No red-capable command, no Phase 2." ->
   `brp-debug.md` rules.
2. The 10-rung feedback-loop ladder, in preference order: failing test at
   whatever seam reaches the bug -> curl/HTTP script -> CLI + fixture diffed
   against a known-good snapshot -> headless browser script -> replay a captured
   trace -> throwaway harness (minimal subset, mocked deps, one function call)
   -> property/fuzz loop (1000 random inputs) -> bisection harness wired for
   `git bisect run` -> differential loop (old vs new version, diff outputs) ->
   HITL bash script as last resort. BRP compresses all of this into
   "reproduction path". -> new `references/feedback-loop-ladder.md`.
3. Loop quality bar, 4 checkboxes: red-capable (asserts the user's exact
   symptom, "not 'runs without erroring'"), deterministic, fast (seconds not
   minutes), agent-runnable unattended. Plus "treat the loop as a product" and
   tighten it: faster, sharper signal, more deterministic (pin time, seed RNG,
   isolate FS, freeze network). "A 30-second flaky loop is barely better than no
   loop; a 2-second deterministic one is a debugging superpower."
4. Non-deterministic protocol: the goal is not a clean repro but a higher
   reproduction rate - loop 100x, parallelise, add stress, inject sleeps. "A
   50%-flake bug is debuggable; 1% is not."
5. Minimisation phase (entirely absent from BRP). Once red, cut
   inputs/callers/config/data/steps one at a time, re-running after each; done
   when every remaining element is load-bearing (removing any makes it go
   green). Payoff: shrinks the Phase-3 hypothesis space and becomes the Phase-5
   regression test. Also: confirm the loop reproduces the user's failure mode,
   "not a different failure that happens to be nearby. Wrong bug = wrong fix."
6. Hypotheses: 3-5, ranked, falsifiable, generated before testing any
   ("single-hypothesis generation anchors on the first plausible idea"). Each
   must state its prediction: "If X is the cause, then changing Y will make the
   bug disappear." "If you cannot state the prediction, the hypothesis is a
   vibe - discard or sharpen it." Plus a user checkpoint: show the ranked list
   before testing (they re-rank instantly with domain knowledge), but don't
   block if the user is AFK. BRP has "a short hypothesis list ordered by
   likelihood" - no count, no falsifiability, no checkpoint.
7. Instrumentation discipline: one variable at a time; debugger/REPL first ("one
   breakpoint beats ten logs"), then targeted logs at hypothesis-distinguishing
   boundaries, never "log everything and grep". Tag every debug log with a
   unique prefix (`[DEBUG-a4f2]`) so cleanup is a single grep - "untagged logs
   survive; tagged logs die." BRP says "clean up all debug artifacts" with no
   mechanism.
8. Perf branch: for performance regressions "logs are usually wrong" - establish
   a baseline measurement (timing harness, `performance.now()`, profiler, query
   plan), then bisect. Measure first, fix second. `brp-debug.md` claims perf
   regressions in scope but offers no perf-specific method.
9. Regression-test seam judgment. Write the regression test before the fix only
   if a correct seam exists - one that exercises the real bug pattern as it
   occurs at the call site. A too-shallow seam "gives false confidence". "If no
   correct seam exists, that itself is the finding" - document it as an
   architecture problem and hand off. This directly qualifies `brp-fix.md`'s
   flat rule "Always add a test for the case that was broken."
10. Phase-6 exit checklist: original repro no longer reproduces; regression test
    passes or seam absence documented; all `[DEBUG-...]` removed via grep;
    throwaway prototypes deleted; the hypothesis that turned out correct stated
    in the commit/PR message "so the next debugger learns"; then ask "what would
    have prevented this bug?" and hand off to the architecture lane - after the
    fix is in, "not before - you have more information now than when you
    started."
11. Redaction rule tied to artifact sharing. Because the skill shows commands,
    outputs and captured artifacts: redact secrets first (`<REDACTED>`), build
    loops against env vars so the credential stays in the environment,
    HAR/captured artifacts carry auth headers so quote only the signal lines; if
    the redacted output is insufficient to diagnose, say so and ask. BRP has
    `interactive-auth-secrets.mdc` but nothing connecting it to debug evidence
    output.
12. "When you genuinely cannot build a loop": stop and say so, list what you
    tried, and ask for (a) environment access, (b) a redacted captured artifact
    (HAR, log dump, core dump, timestamped screen recording), or (c) permission
    for temporary production instrumentation. "Do not proceed to hypothesise
    without a loop."
13. Shipped asset: `scripts/hitl-loop.template.sh` - structures
    human-in-the-loop iteration so captured output still feeds back to the
    agent.

Non-adoptable / duplicate:

- BRP's `debug-investigation-template.md` (symptoms / hypotheses + cheapest
  check / isolation / fix / verification) is an artifact Matt lacks - keep it,
  and extend it with a "loop command + its output" field and a minimisation
  section.
- BRP's explicit escalation routing (debug -> fix -> plan) is a BRP design
  feature with no Matt equivalent.
- "Never fix without reproducing first" and "minimal diff only" in `brp-fix.md`
  already cover Matt's Phase 2/5 basics.

## 4. improve-codebase-architecture

Core mechanism: three stages: (1) a scoped scan - decide where to look via git
hot spots before looking - delegated to a sub-agent, using a locked design
vocabulary and the deletion test; (2) output is a candidate report
(self-contained HTML in `$TMPDIR`, before/after diagrams, strength badges) and
then stop: "Do NOT propose interfaces yet. Ask the user which to explore"; (3) a
grilling loop on the chosen candidate that emits doc side effects.

Missing moves (BRP targets: `brp/references/brp-refactor.md`,
`src/skills/core/brp-code-quality/SKILL.md`):

- Scope before you scan - YAGNI. If the user named a direction, take it;
  otherwise walk `git log --oneline` back a good stretch to find hot spots -
  "the files and areas that keep coming up" - and let those pull attention
  first; widen the net if scattered. Rationale: deepening pays off on code that
  keeps changing. -> `brp-refactor.md` step 0 / `brp-code-quality` audit step.
- The deletion test as the candidate filter: "would deleting it concentrate
  complexity, or just move it? A 'yes, concentrates' is the signal you want."
  BRP's refactor unit of work is mechanical (split files, extract helpers,
  atomic files) with no test for whether the extraction earns its keep. ->
  `brp-refactor.md` rules.
- Named friction heuristics for the scan: understanding one concept requires
  bouncing between many small modules; interface nearly as complex as
  implementation; pure functions extracted purely for testability while the real
  bugs hide in how they're called (no locality); tightly-coupled modules leaking
  across their seams; areas untested or hard to test through the current
  interface. -> new `brp-refactor` reference.
- An enforced architecture vocabulary - module / interface / depth / seam /
  adapter / leverage / locality, "use these terms exactly - don't drift into
  component, service, API, or boundary" - with principles: the interface is the
  test surface; one adapter means a hypothetical seam, two means a real one;
  interface = every fact a caller must know (invariants, ordering, error modes,
  perf), not just the type signature. BRP's entire corpus contains one passing
  mention of "explicit seams" in `rules/core/design-pattern-selection.mdc`.
- Candidate-first workflow with a recommendation-strength scale: Strong / Worth
  exploring / Speculative badges, a "Top recommendation" section, and a hard
  stop for user selection before any interface is designed. BRP has a P0-P3
  rubric for review findings but no strength scale for proposals, and
  `brp-refactor.md` starts at "map the responsibilities and decide the
  extraction order".
- Per-candidate card contract: files involved / problem in one sentence /
  solution in one sentence / benefits stated in terms of locality and leverage
  and how tests would improve / before-after / strength badge. Worth adopting as
  markdown even without HTML.
- ADR conflict handling: surface a candidate that contradicts an existing ADR
  only when the friction is real enough to warrant revisiting it, and mark it
  inline ("contradicts ADR-0007 - but worth reopening because..."); "don't list
  every theoretical refactor an ADR forbids." BRP never consults prior
  decisions.
- Rejection becomes an artifact: when the user rejects a candidate for a
  load-bearing reason, offer an ADR "so future architecture reviews don't
  re-suggest it" - skipping ephemeral ("not worth it right now") and
  self-evident reasons. -> `brp-refactor.md` + `brp-docs`.
- Design-it-twice: parallel sub-agents design the interface several radically
  different ways, then compare on depth, locality and seam placement.
  `brp-plan.md` says it compares "multiple implementation paths" but supplies no
  mechanism. -> `brp-plan.md`.
- Report artifacts never land in the repo: timestamped file in
  `$TMPDIR`/`/tmp`/`%TEMP%`, opened with `open`/`xdg-open`/`start`, absolute
  path told to the user. Worth stating as a BRP output discipline regardless of
  format.

Non-adoptable / duplicate:

- The HTML + Tailwind-CDN + Mermaid rendering (`HTML-REPORT.md`) is heavy and
  conflicts with BRP's terse-markdown output contracts and ASCII posture - adopt
  the card structure, not the renderer.
- `brp-refactor.md`'s green-baseline gate ("a red baseline blocks the refactor",
  re-run after each step, revert on divergence) is stronger than Matt's, who has
  no test gate here at all.
- Genuine tension, not a gap: BRP's atomic-file rule ("one exported unit per
  file") is a file-layout rule while depth is an interface rule; adopting
  deep-module framing wholesale without reconciling the two would conflict with
  the BusiRocket baseline.
- Also conflicting: `brp-refactor.md`'s "preserve public interfaces, callers
  should not need to change" is incompatible with deepening, which changes
  interfaces by design - deepening needs its own lane rather than being folded
  into the no-behavior-change refactor lane.
