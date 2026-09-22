---
name: instruction-ab-test
description:
  Tests whether an instruction change improves or degrades the work, by scoring
  both versions against the project's own checker. Trigger when an instruction
  file is about to be rewritten, shortened, merged or deleted, when prose is
  suspected of duplicating a linter, or when a guidance change needs evidence
  before it ships. Do not use for code changes that a test suite already covers,
  for one-off wording fixes with no behavioural claim, or for choosing between
  models.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [rule-or-skill-path]
---

# An instruction is a change to behaviour, so measure it like one

Prose in a rule file is code that runs on every session. Rewriting it on taste
is shipping an unmeasured change to every future task. Three measurements on
2026-09-18 produced three different right answers for the same question, and
none of them was the one predicted beforehand: TypeScript prose was replaced,
Rust prose was left alone, and Python prose was corrected by a single line. Any
of the three applied to the others would have made the repository worse.

## The gate

**Do not rewrite, shorten, merge or delete an instruction on the strength of an
argument.** Run both versions over the same tasks, score them with the checker
that will judge real work, and keep whichever wins. If the change cannot be
measured, say so and leave it alone.

## Workflow

1. State the claim as an outcome the checker can decide: fewer findings, fewer
   files, fewer tokens. "Clearer" is not a claim.
2. Build the arms. One is the current text, one the proposed text, each stripped
   of frontmatter. Change ONE thing between them; two changes give an
   uninterpretable result.
3. Write tasks the instruction is supposed to govern -- three at the very least,
   more when the effect is small. Include the traps the repository has actually
   hit, not toy problems.
4. Run each arm over each task with `codex exec --sandbox read-only`, an
   `--output-schema` returning `{files:[{path,content}]}`, and `-C` pointed at a
   REAL project of that language. An arm told to read configuration needs a
   project to read.
5. Score by running the project's own checker on the produced files. Confirm the
   scoring works before believing it, per the positive control below.
6. Re-measure the text as it will actually ship, not the laboratory variant.
7. Attack the result with an adversarial pass before acting on it (below).

## The traps, each of which invalidated a result before it was caught

**Score the files the model actually wrote.** The first Rust harness created its
own crate with an empty `src/lib.rs` and ran the checker there, while the arms
had written to `crates/<name>/src` and `src-tauri/src`. Five of six scores
examined no submitted code and reported a clean 0. Find the crate or package
root the output produced and score there.

**Judge by the same configuration the arm was told to read.** The first Python
harness used a stricter `codeality-py.toml` than the one in the project the arms
read, inventing 13 `BPY006` findings against code that was correct for its
target. The judge and the instruction must agree on what the rules are.

**Prove the checker can fail.** A harness that reports 0 may be scoring nothing.
Plant a deliberate violation, confirm it is reported, remove it. The Rust judge
was only trustworthy once a planted file returned `4 errors`.

**Subtract only artefacts of the bench.** Directory names chosen for the bench
tripped `check-file/folder-naming-convention` identically in every arm, so it
cancels. Anything that does not appear equally in all arms is a result, not
noise.

**A bench with generated code cannot live inside the repository it judges.** A
copy left under the tree failed `check:ci` with 40 parse errors.

**`codex exec` needs `< /dev/null`.** A heredoc earlier in the same shell call
consumes stdin and codex waits on it until the timeout, logging only "Reading
additional input from stdin...". Outside a git repository it also needs
`--skip-git-repo-check`.

## The adversarial pass is not optional

Hand the bench and the claims to a fresh `codex exec --sandbox read-only` and
ask it to show they are wrong, not to review them. Name the confounds to hunt:
what differed between arms besides the instruction, whether the scoring was
valid, what the sample size actually supports, whether retried or timed-out runs
bias the cost figures, and whether the causal story was fitted after the fact.
Require a verdict of SUPPORTED, OVERREACHED or UNSUPPORTED per claim.

It earns its cost. On its first use it found that the Rust judge had scored
empty crates, which had already been written into a rule and committed; that a
29% cost claim omitted a matched task; and that a printed "tokens used" counter
is not total or monetary cost because it excludes cached input. Verify each
finding yourself before accepting it -- one of its objections was wrong -- but
do not ship a conclusion it has not seen.

## What the result licenses

A win on three tasks is a reason to change one instruction, not a law. State the
sample with the claim, and never apply a result to a second rule by analogy: the
three languages measured on the same day disagreed. Write the number and the
date into the rule so the next reader can tell a measurement from an opinion.

## Self-healing and self-improvement

When a step here fails during use, fix the immediate problem, establish what
changed with evidence, then edit the failing section in this file in the same
session. Replace the stale instruction rather than appending a second version
beside it. When a run succeeds and a new harness trap appears, add it to the
traps above and delete any step that has never mattered.
