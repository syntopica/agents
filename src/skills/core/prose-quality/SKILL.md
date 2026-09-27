---
name: prose-quality
description:
  Edits or audits prose to cut AI writing patterns while keeping the writer's
  voice and facts. Trigger when drafting or reviewing text a person will read (a
  README, a post, an email, a recap, a form answer, a wiki page), or when asked
  whether a draft sounds like AI. Triggers (ES) are suena a IA, quita el slop,
  pulir el texto, revisa la redaccion. Do not use for code, commit messages
  governed by their own format, or ASCII punctuation alone (that is
  text-hygiene).
allowed-tools: Read, Grep, Glob, Edit, Write
argument-hint: [file-or-draft] [edit|detect]
---

## Modes

- **Write.** You are producing the text yourself. Apply the rules while
  drafting, then run `references/checklist.md` once on the result before handing
  it over. Say nothing about the process.
- **Edit (default when given a draft).** Make the minimum effective edit. Return
  the full edited draft and a short `What changed` list.
- **Detect.** Asked to audit, scan or flag without rewriting. For each hit, name
  the pattern from `references/patterns.md`, quote the line and give the fix in
  a few words. Do not rewrite, do not score, and never claim or deny that an AI
  wrote it: a named pattern is evidence the reader can check, a detector's guess
  is not.

## Rules

- Keep the writer's point, voice, bluntness, humor and uncertainty. Leave strong
  human sentences alone; a rough draft should still sound like its author.
- Never add a claim, number, example, quote or source that is not in the draft
  or the evidence at hand. When a weasel attribution ("studies show") has no
  source, flag it instead of inventing one.
- Be concrete: names, numbers, dates, mechanisms. A sentence that could move
  unchanged to another product, company or person is filler; cut it or make it
  specific.
- Technical vocabulary is not slop. `robust` for an estimator, `leverage` in
  finance, `harness` for a test harness and `realm` in Keycloak keep their
  meaning; the word lists target decorative use only.
- Match the destination's register and the file's own conventions (punctuation
  follows text-hygiene). Text meant to be pasted keeps one paragraph per line.
- Quoted examples, code, identifiers and error strings are never edited.

## Workflow

1. Read the whole text first. Name its job and reader in one line; if you
   cannot, ask.
2. Walk `references/patterns.md`: words, then sentence patterns, then
   formatting.
3. Edit or report according to the mode.
4. Run `references/checklist.md` against the result. Fix any failure and run it
   again.

## Output

- Edit: the full draft, then `What changed` with one line per kind of change.
- Detect: one line per finding, `pattern - "quoted line" - fix`, grouped by
  pattern, then an offer to edit.
- Write: only the text.
