---
name: design-quality
description:
  Audits and improves a running web UI's design with codeality-ui measurements
  plus a screenshot review. Trigger when asked to check, review or improve how
  a screen looks, whether a UI is polished, what a screen is missing, or to
  redesign a page so it stops looking AI-made, or to have a chosen model
  (Codex, Claude, ChatGPT web) critique screens and propose a better design as mockup images.
  Triggers (ES) are revisa el diseño, check-design, mejora la UI, que le falta
  a esta pantalla, modo creativo, vamos a mejorar la UI de X usando codex.
  Do not use for building a new UI from a blank page (that is
  frontend-design), for prose (prose-quality) or for functional testing of a
  running app (ui-verification-loop).
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: [route-or-url...] [check|review|propose|redesign] [codex|claude]
---

# Design quality: measure, then judge, then change

Four modes, from cheapest to most invasive. Each one includes the one before.

- **check** - defects only. Run `codeality-ui check` and report its findings. No
  screenshots read, no opinions. This is what CI runs.
- **review** (default) - defects, improvements and missing pieces. `check`, then
  read the screenshots against `references/rubric.md`. No edits.
- **propose** - full-page screenshots, the app's brief (what it is for, who uses
  it) and outside references go to the model the person names ("mejora la UI de
  X usando codex"), which returns a critique, a new approach and mockup images.
  No edits; it stops for the person to pick a direction. Section 4.
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
2. Operate what a screenshot shows closed. Screenshots, the rules and a
   screenshot reviewer all see a menu, drawer or dialog only in its resting
   state: on 2026-10-01 a 66-route admin sweep passed both `check` and a Codex
   visual review while the phone menu opened onto a drawer with no links, and
   the owner found it. At the phone viewport, open the navigation menu, every
   dialog trigger in the header and one row action, and confirm each reveals
   working controls, closes on Escape and returns focus or navigates. Then use
   one form the way its user would: focus a field, type, submit. The same day a
   14px reply box made iOS Safari zoom the inbox on focus and cut off Send;
   `input-zoom` now measures that, but a typed-in form still shows what a still
   frame cannot.
3. Walk `references/rubric.md` section by section. For an admin, CRM or other
   operational tool, also walk `references/admin-rubric.md`: about 100 concrete
   items (tables, forms, threads, dashboards, states), each with its source and
   whether a rule already measures it.
4. Report in three groups, each item with route, element or area, why it matters
   to the person using the screen, and the fix in one line:
   - **Defects** - every `check` finding, quoted, plus visual breakage the rules
     cannot see (overlaps in screenshots, broken images, a state that reads as
     an error).
   - **Improvements** - hierarchy, density, rhythm, consistency, affordance.
   - **Missing** - what the screen needs to do its job and does not have:
     states, controls, information. Name the job first; a missing piece is
     missing relative to a job.
5. Rank inside each group by how often the person hits it, not by how easy it is
   to fix. Then offer redesign.

## 4. propose mode

The person's own method, which gave strong results in ChatGPT: screenshot plus
the real job, "look at how others do it", a critique from the user's seat, a
change of approach rather than touch-ups, and a mockup image. Replicate it, with
the repository as extra context.

1. **Model.** "usando codex" (or no model named): Codex writes the critique and
   draws the mockups. "usando claude": you write the critique and research,
   Codex only draws the mockups, because Claude cannot generate images. "usando
   chatgpt": ChatGPT's web UI in Orca's browser does both, through
   `scripts/chatgpt_propose.py`; it cannot read the repository, so the brief
   goes inside the prompt.
2. **Brief.** Read `docs/ui-brief.md` in the project. When it is missing, draft
   it from the repo (README, routes, roles, domain models) with the template in
   `references/propose.md`, show it, and wait for corrections once; it is then
   reused on every run. Never invent a persona the repo does not support; mark
   guesses as guesses.
3. **Screens.** Run `codeality-ui check --routes '<glob>'` for the routes named
   (section 1 covers setup and auth). Captures are already full-page. Take the
   widest light and the phone light screenshot of each route from `report.json`;
   several routes are fine, which is how a flow is shown. A production URL in
   the request names the screen, not the target: capture the same path on the
   project's running dev server, whose data and login are the ones on record. On
   2026-10-15 a run aimed at `tieneslavibra.com/admin/leads` lost half an hour:
   Cloudflare blocks the headless browser's login on production, and the page
   then reads "Correo o contraseña incorrectos", so the credentials look wrong
   when they are not. The agent read the hang as a slow page; the leads board
   also holds its `load` event on per-lead avatar requests. A headless login
   that does not redirect on production means Cloudflare: do not retry it and do
   not suspect the password, capture on the dev server.
4. **Hand-off.** Make `.codeality-ui/propose/<YYYY-MM-DD-HHMM>/`, copy the
   chosen screenshots and the brief into it, and run the prompt in
   `references/propose.md` with the command given there for the chosen model. It
   writes `critique.md` and `mockup-*.png` into that directory.
5. **Check before showing.** Read every mockup. Reject and resume (same session)
   any mockup that drops a real feature, invents data presented as real, or
   ignores the brief's persona. Confirm each critique point names something
   visible in a screenshot. A feature the product lacks is not a reason to
   reject: when the model brings a competitor's pattern or its own idea that
   would serve the brief's users, keep it marked **new** and weigh it for
   integration (owner order, 2026-10-15). Drop one only when it contradicts a
   business or fiscal rule, duplicates something that exists, or serves no job.
6. **Deliver.** Show the mockups (Read them; send the files when the person is
   on another device), then the critique in five to ten lines: the change of
   approach first, then the problems ranked by how often the user hits them,
   then the references, then the **new** features worth integrating, each with
   the job it serves, where the idea came from and its cost (UI only, new
   endpoint, or new table or column). Stop and ask which direction to take. "Sí,
   aplícalo" goes to redesign with the chosen mockup as the target and
   `critique.md` as scope.

## 5. redesign mode

1. Copy `.codeality-ui/screens/` to `.codeality-ui/before/` and keep the finding
   list as the baseline of this change.
2. **When the target is a mockup, the mockup is the scope, not a mood board.**
   Before editing, write `gaps.md` next to the mockups: one line for every
   section, field, badge, button, empty state and phone-only element visible in
   each mockup (desktop and phone), and one for every numbered proposal in
   `critique.md`. Mark each `build`, `exists`, `needs schema` (new table or
   column; say which) or `rejected` with a reason the person would accept;
   "minor" and "later" are not reasons. Everything marked `build` is in scope.
   On 2026-10-15 the TienesLaVibra lead, client and booking pages shipped with
   the mockups' skeleton only - no activity tabs, no "Vincular cliente", no
   pending-issues block, no contact rows, edit form still always open - and the
   owner had to point out that ChatGPT's designs were complete and the copy was
   minimal.
3. Agree the scope from the review (or the creative direction). Change the code
   where the design system lives: tokens and shared components before one-off
   classes. Keep the project's stack, conventions and file rules. When a model
   writes the change (yourself, a subagent or Codex), give it a concrete
   specification, not taste words: `references/prompting.md` has what the
   Anthropic and OpenAI guides recommend and an `<admin_ui>` block ready to
   paste for operational screens.
4. Re-run `codeality-ui check` after each change. Never silence a finding with
   `disable` to get to zero; a `disable` entry needs a reason a reviewer would
   accept, written in the file.
5. Run the project's own gates (type-check, lint, tests) before calling it done.
6. Put the after screenshots beside the mockups and walk `gaps.md` line by line:
   each `build` line is either visible on an after screenshot or moved to the
   project's TODO with the reason it could not ship. A line still open means the
   redesign is not done.
7. Finish with `references/checklist.md`, then show the before and after
   screenshots of the same route, viewport and scheme side by side, and list
   what changed in one line per change.

## Rules

- Evidence over taste: every item names something visible on a screenshot or a
  number in the report. "Feels cluttered" is not a finding; "four type sizes in
  one row, two of them 1px apart" is.
- Never invent data or copy, and never present a feature as existing when it
  does not. A missing piece, or a competitor's idea worth adopting, is proposed
  as **new** for the person to choose, not built silently and not discarded.
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
