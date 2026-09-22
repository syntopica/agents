# Skill and Router Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce valid target-specific skill views, install every workflow
skill referenced by the router, and turn all 113 measured phrases into explicit
routing expectations with zero wrong-lane outcomes.

**Architecture:** Preserve raw upstream and Claude-native skills in the private
library. Compile a portable view for strict clients, classify rather than
mislabel platform extensions, and resolve logical skill keys through
target-specific aliases. The router corpus becomes a regression suite whose
silent phrases must be intentional.

**Tech Stack:** TypeScript, Python 3 for the existing hook, `node:test`, the
external Agent Skills validator, `skillkit` 1.24.0 as the existing upstream
fetch layer.

**Spec:**
`docs/superpowers/specs/2026-08-18-agent-platform-reliability-design.md`

## Global Constraints

- Never edit vendor skills merely to satisfy a different platform's schema.
- Claude output retains Claude-native extensions; portable output is compiled
  separately.
- Fixture and example skills never enter a production target.
- Router expectations must come from measured prompts, not invented
  regex-friendly examples.
- Canonical logical names may contain a namespace; filesystem aliases may not.
- No automatic deletion from `~/.agents/skills`.
- Every task ends with a commit and `git push origin HEAD`.

---

### Task 1: Classify the complete user skill library

**Files:**

- Create: `scripts/lib/skills/constants/SKILL_PORTABILITY_KINDS.ts`
- Create: `scripts/lib/skills/types/SkillPortabilityKind.ts`
- Create: `scripts/lib/skills/types/SkillPortabilityFinding.ts`
- Create: `scripts/lib/skills/classifySkillPortability.ts`
- Create: `scripts/lib/skills/inspectSkillLibrary.ts`
- Create: `scripts/lib/skills/formatPortabilityReport.ts`
- Create: `scripts/commands/auditSkillPortability.ts`
- Create: `scripts/bin/run-audit-skill-portability.ts`
- Test: `scripts/lib/skills/CLASSIFY_SKILL_PORTABILITY_TEST.ts`
- Modify: `package.json`

Classifications are `portable`, `claude-extension`, `target-extension`,
`fixture`, and `invalid`. Only `invalid` is an unexplained failure.

- [ ] Build fixtures containing standard frontmatter, `allowed-tools`,
      `argument-hint`, `paths`, `command`, `triggers`, a colon name, malformed
      YAML, and a sample fixture path.
- [ ] Run the test and confirm it fails before implementation.
- [ ] Implement classification using the existing frontmatter splitter and an
      explicit extension field registry.
- [ ] Add `skills:portability` to `package.json`.
- [ ] Run `pnpm run skills:portability -- --library ~/.agents --json`.
- [ ] Confirm all 301 `SKILL.md` files are accounted for and the former 57
      failures are split into explained extensions, fixtures, or true invalid
      files.
- [ ] Create regression fixtures for every true invalid shape before repairing
      its source.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add package.json scripts/bin scripts/commands scripts/lib/skills
git commit -m "feat: classify user skill portability"
git push origin HEAD
```

---

### Task 2: Compile target-specific external skill views

**Files:**

- Create: `scripts/lib/library/types/SkillTarget.ts`
- Create: `scripts/lib/library/types/CompiledSkill.ts`
- Create: `scripts/lib/library/resolveTargetSkillName.ts`
- Create: `scripts/lib/library/compileLibrarySkill.ts`
- Create: `scripts/lib/library/compileLibraryTarget.ts`
- Create: `scripts/lib/library/validateCompiledLibrary.ts`
- Test: `scripts/lib/library/COMPILE_LIBRARY_SKILL_TEST.ts`
- Test: `scripts/lib/library/VALIDATE_COMPILED_LIBRARY_TEST.ts`
- Modify: `scripts/commands/libraryLink.ts`
- Modify: `scripts/lib/library/types/PlannedLink.ts`
- Modify: `scripts/lib/library/planLinks.ts`

Compiled targets live under `~/.agents/compiled/<target>/skills`; source stays
under `~/.agents/skills`. Claude links raw source. Codex, Gemini, Cursor, and
other strict clients link the portable compiled view.

```ts
export interface CompiledSkill {
  logicalName: string
  targetName: string
  sourcePath: string
  outputPath: string
}
```

- [ ] Write tests proving Claude retains `allowed-tools` and `argument-hint`,
      while a portable target keeps only `name`, `description`, `license`,
      `compatibility`, `metadata`, and `allowed-tools` only where the target
      explicitly supports it.
- [ ] Test namespace aliasing: `superpowers:systematic-debugging` becomes
      `superpowers-systematic-debugging` without changing its logical key.
- [ ] Run the tests and confirm they fail before implementation.
- [ ] Reuse `stripAnthropicOnlyFields`; do not create a second frontmatter
      stripper.
- [ ] Make `library:link --target <id>` compile before planning links.
- [ ] Run the external validator against every portable compiled skill.
- [ ] Run `pnpm run library:test`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/commands/libraryLink.ts scripts/lib/library
git commit -m "feat: compile external skills per target"
git push origin HEAD
```

---

### Task 3: Declare and install the Superpowers workflow pack

**Files:**

- Create: `machine/skills.json`
- Create: `scripts/lib/skill-sources/types/SkillSource.ts`
- Create: `scripts/lib/skill-sources/types/SkillSourceManifest.ts`
- Create: `scripts/lib/skill-sources/parseSkillSourceManifest.ts`
- Create: `scripts/lib/skill-sources/planSkillSourceInstall.ts`
- Create: `scripts/commands/bootstrapSkillSources.ts`
- Create: `scripts/bin/run-bootstrap-skill-sources.ts`
- Test: `scripts/lib/skill-sources/PARSE_SKILL_SOURCE_MANIFEST_TEST.ts`
- Modify: `package.json`

Declare `obra/superpowers` with these required skills: `brainstorming`,
`writing-plans`, `systematic-debugging`, `executing-plans`,
`subagent-driven-development`, `verification-before-completion`,
`requesting-code-review`, and `receiving-code-review`.

The bootstrap command prints and validates this argument array before spawning
it:

```ts
;[
  'install',
  'obra/superpowers',
  '--skills=brainstorming,writing-plans,systematic-debugging,executing-plans,subagent-driven-development,verification-before-completion,requesting-code-review,receiving-code-review',
  '--global',
  '--yes',
  '--scan',
  '--json',
]
```

- [ ] Write parser tests rejecting floating sources without a recorded resolved
      commit.
- [ ] Implement dry-run by default and `--apply` for installation.
- [ ] Snapshot `~/.agents/.skill-lock.json` and affected destinations before
      apply.
- [ ] Run `pnpm run skills:bootstrap` and inspect the plan.
- [ ] Run `pnpm run skills:bootstrap -- --apply`.
- [ ] Add or update the eight entries in `~/.agents/curation.json` with
      provenance and target aliases; commit and push that private library
      separately using its existing git identity.
- [ ] Run `pnpm run library:link -- --target codex` and the corresponding
      active-target links.
- [ ] Verify all eight logical keys resolve in Claude, Codex, and Gemini skill
      inventories.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push this repository:

```bash
git add machine/skills.json package.json scripts/bin scripts/commands scripts/lib/skill-sources
git commit -m "feat: declare required workflow skills"
git push origin HEAD
```

---

### Task 4: Make router ownership and reachability explicit

**Files:**

- Create: `scripts/lib/library/learning/types/SkillAlias.ts`
- Create: `scripts/lib/library/learning/resolveLaneSkill.ts`
- Create: `scripts/lib/library/learning/validateLaneSkills.ts`
- Test: `scripts/lib/library/learning/VALIDATE_LANE_SKILLS_TEST.ts`
- Modify: `scripts/lib/library/learning/constants/LANE_SKILLS.ts`
- Modify: `scripts/lib/library/learning/classifyRouterOutcome.ts`
- Modify: `scripts/commands/libraryRouterAudit.ts`

- [ ] Write a failing test where a lane references a missing skill and another
      where the logical key resolves through a target alias.
- [ ] Implement reachability validation against the curation manifest and
      compiled target catalog.
- [ ] Add the missing `plan`, `docs`, `release`, `environment-ops`, and
      `repo-modernization` lane ownership entries so every route has a declared
      skill or explicit policy-only classification.
- [ ] Make `library:router-audit` fail before probing if a routed skill is
      unreachable.
- [ ] Run `pnpm run library:test`.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add scripts/commands/libraryRouterAudit.ts scripts/lib/library/learning
git commit -m "feat: validate router skill reachability"
git push origin HEAD
```

---

### Task 5: Convert measured routing outcomes into regression fixtures

**Files:**

- Create: `src/hooks/router-expectations.json`
- Create: `scripts/lib/hooks/types/RouterExpectation.ts`
- Create: `scripts/lib/hooks/loadRouterExpectations.ts`
- Create: `scripts/lib/hooks/ROUTER_EXPECTATIONS_TEST.ts`
- Modify: `src/hooks/utils/route_prompt.py`
- Modify: `src/hooks/router-fixtures.json`
- Modify: `scripts/lib/hooks/constants/ROUTER_FIXTURES.ts`
- Modify: `scripts/commands/libraryRouterAudit.ts`

`router-expectations.json` records each measured phrase with `expectedLane` or
`intentionalSilence: true` and a short reason. A phrase may not omit both
fields.

- [ ] Import all 113 measured phrases from
      `~/.agents/learning/trigger-phrases.json` into the expectations file
      without adding synthetic text.
- [ ] Add a test that every phrase appears exactly once and every non-silent
      expectation selects the declared lane.
- [ ] Reorder and narrow patterns to eliminate the 5 wrong-lane outcomes. Prefer
      noun anchors and negative cases over adding broad verbs.
- [ ] Classify the 81 prior silent outcomes: add a route only when a global
      workflow intervention is justified; otherwise record intentional silence
      with a reason.
- [ ] Keep bare acknowledgements and machine-generated prompts silent.
- [ ] Run `pnpm run hooks:test` and
      `pnpm run library:router-audit -- --dry-run --json`.
- [ ] Confirm `wrong` is 0 and `silent` contains only intentional-silence
      expectations.
- [ ] Run `pnpm run format && pnpm run lint:fix`.
- [ ] Commit and push:

```bash
git add src/hooks scripts/commands/libraryRouterAudit.ts scripts/lib/hooks
git commit -m "fix: make measured router outcomes deterministic"
git push origin HEAD
```

---

### Task 6: Add portability and router coverage to the main gate

**Files:**

- Create: `scripts/lib/skills/PORTABLE_LIBRARY_VALIDATION_TEST.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/ide-setup.md`

- [ ] Add a non-mutating library portability test to `skills:lint`.
- [ ] Add `ROUTER_EXPECTATIONS_TEST.ts` to `hooks:test`.
- [ ] Document the difference between raw, Claude-native, and portable skill
      views.
- [ ] Run inventories for Claude personal, Claude secondary, Codex, and Gemini;
      record counts and zero broken links without exposing account state.
- [ ] Run `pnpm run check:all && git diff --check`.
- [ ] Commit and push:

```bash
git add package.json README.md docs/ide-setup.md scripts/lib/skills
git commit -m "test: gate skill portability and router coverage"
git push origin HEAD
```

## Completion Gate

Run:

```bash
pnpm run check:all
pnpm run skills:portability -- --library ~/.agents --json
pnpm run library:router-audit -- --dry-run --json
pnpm run agents:doctor -- --json
git status --short --branch
```

Expected: every skill is classified, strict target outputs pass the external
validator, every routed skill is reachable, wrong-lane count is zero, and all
silence is intentional and recorded.
