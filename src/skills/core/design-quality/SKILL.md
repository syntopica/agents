---
name: design-quality
description:
  Audits and improves a running web UI's design with codeality-ui measurements
  plus a screenshot review. Trigger when asked to check, review or improve how
  a screen looks, whether a UI is polished, what a screen is missing, or to
  redesign a page so it stops looking AI-made. Triggers (ES) are revisa el
  diseño, check-design, mejora la UI, que le falta a esta pantalla, modo
  creativo. Do not use for building a new UI from a blank page (that is
  frontend-design), for prose (prose-quality) or for functional testing of a
  running app (ui-verification-loop).
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: [route-or-url] [check|review|redesign]
---

# Design quality: measure, then judge, then change

Three modes, from cheapest to most invasive. Each one includes the one before.

- **check** - defects only. Run `codeality-ui check` and report its findings. No
  screenshots read, no opinions. This is what CI runs.
- **review** (default) - defects, improvements and missing pieces. `check`, then
  read the screenshots against `references/rubric.md`. No edits.
- **redesign** - `review`, then change the code. Finished only when `check`
  reports nothing new and the before/after screenshots are in front of the
  person. Add "creative" when the person wants a new direction rather than a
  repair: propose it in three lines and get a yes before editing.

The tool measures; you judge. Never re-measure what the report already says
(contrast ratios, x offsets, widths): quote it. Spend your attention on what a
rule cannot see.

## 1. Get the measurements

1. In the project root, look for `codeality-ui.json`. If it is missing, run
   `pnpm dlx @syntopica/ui-quality init` (or the workspace binary when the
   package is installed), then set `baseUrl`, the `routes` to judge and, for a
   logged-in area, `auth` with the names of two environment variables. Add a
   `palette` from the project's own tokens (root custom-property prefixes such
   as `--brand-`, `--gray-`, plus `#ffffff`): without it the palette rule is
   off.
2. Judge the whole area, not the page that was named: every list, and for each
   one a detail, a "new" and an "edit" page. Take real ids from the links each
   list renders; when a local table is empty, seed a clearly labelled local
   fixture (and its undo script) rather than skipping the page. On TienesLaVibra
   the first full run (61 routes) found 297 findings, most of them on child
   pages nobody had opened.
3. Credentials come from the password manager into the environment for the one
   command, never into the file, the chat or a commit:
   `UI_QUALITY_USER="$(op read ...)" UI_QUALITY_PASSWORD="$(op read ...)" codeality-ui check --json`.
4. A local dev server is the default target; production is fine for `check` and
   `review` when the pages only read. Some pages write on view (an inbox thread
   marks itself read), so check what a route does before pointing at production.
   Never point `redesign` verification at production before the change is
   deployed.
5. Exit 0 or 1 is a result. Exit 2 is configuration (read stderr), exit 3 a
   browser or page failure (Playwright browsers missing:
   `pnpm exec playwright install chromium`).

The run leaves `.codeality-ui/report.json` (findings and the screenshot path of
every route x viewport x scheme) and `.codeality-ui/screens/*.png`.

## 2. check mode

Group findings by route, then by rule, errors first. One line each:
`rule - element - what the report says - the smallest fix`. Stop there.

## 3. review mode

1. Read `report.json`. Open the widest light screenshot, the phone one and the
   widest dark one of each route with the Read tool. Look at them as the person
   who uses the screen every day would.
2. Walk `references/rubric.md` section by section. For an admin, CRM or other
   operational tool, also walk `references/admin-rubric.md`: about 100 concrete
   items (tables, forms, threads, dashboards, states), each with its source and
   whether a rule already measures it.
3. Report in three groups, each item with route, element or area, why it matters
   to the person using the screen, and the fix in one line:
   - **Defects** - every `check` finding, quoted, plus visual breakage the rules
     cannot see (overlaps in screenshots, broken images, a state that reads as
     an error).
   - **Improvements** - hierarchy, density, rhythm, consistency, affordance.
   - **Missing** - what the screen needs to do its job and does not have:
     states, controls, information. Name the job first; a missing piece is
     missing relative to a job.
4. Rank inside each group by how often the person hits it, not by how easy it is
   to fix. Then offer redesign.

## 4. redesign mode

1. Copy `.codeality-ui/screens/` to `.codeality-ui/before/` and keep the finding
   list as the baseline of this change.
2. Agree the scope from the review (or the creative direction). Change the code
   where the design system lives: tokens and shared components before one-off
   classes. Keep the project's stack, conventions and file rules. When a model
   writes the change (yourself, a subagent or Codex), give it a concrete
   specification, not taste words: `references/prompting.md` has what the
   Anthropic and OpenAI guides recommend and an `<admin_ui>` block ready to
   paste for operational screens.
3. Re-run `codeality-ui check` after each change. Never silence a finding with
   `disable` to get to zero; a `disable` entry needs a reason a reviewer would
   accept, written in the file.
4. Run the project's own gates (type-check, lint, tests) before calling it done.
5. Finish with `references/checklist.md`, then show the before and after
   screenshots of the same route, viewport and scheme side by side, and list
   what changed in one line per change.

## Rules

- Evidence over taste: every item names something visible on a screenshot or a
  number in the report. "Feels cluttered" is not a finding; "four type sizes in
  one row, two of them 1px apart" is.
- Never invent data, copy or features the product does not have. A missing piece
  is proposed as missing, not built silently.
- Match the existing design system before improving it. A redesign that
  introduces a second button style is a regression.
- The rules flag symptoms; fix causes. A misaligned column is fixed with grid
  tracks, not by padding one label.
- When text is cut upstream (`text-hard-cut`), the fix is in the data layer:
  send the full text and truncate in CSS, or append an ellipsis.

## Self-healing and self-improvement

When a step here fails in use - a flag the CLI no longer accepts, a rule that
fires on correct design, a rubric item that sent a review the wrong way - fix
the immediate problem, establish what changed with evidence, and edit the
failing section of this skill in the same session, replacing the stale
instruction rather than adding a second one. A false positive in `codeality-ui`
itself is fixed in `~/p/codeality/packages/ui-quality` with a test that
reproduces it. When a review finds a class of defect no rule catches and that
could be measured, add it to the TODO of that package with the screenshot that
showed it.
