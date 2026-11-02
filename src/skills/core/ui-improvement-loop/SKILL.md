---
name: ui-improvement-loop
description:
  Runs a self-paced loop that simplifies an existing app one section at a time
  with progressive disclosure, on real data, with an outside critique and
  before/after screenshots, and rewrites its own playbook after every pass.
  Trigger when the owner says the app feels cluttered, saturating or hard for a
  newcomer, asks to go section by section improving the UI, to keep iterating on
  the design, or to make one product serve both novices and experts. Triggers
  (ES) are la app esta recargada, satura, que se vea sencilla, itera seccion por
  seccion, mejora la UI de cada seccion. Do not use for a one-off review of one
  screen (design-quality), for building a new UI from scratch (frontend-design)
  or for functional bug hunting (ui-verification-loop).
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# UI improvement loop: calm by default, everything one click away

The goal is never fewer features. It is a screen a first-time user understands
in five seconds (what is this, what do I do here, which button) that still gives
an expert every tool within one click. Each pass takes one section from
"recargada" to calm, ships it, and leaves the loop smarter than it found it.

`design-quality` does the measuring, the outside critique (propose mode) and the
redesign gates. This skill decides what to work on, holds the doctrine, and
keeps the ledger. Load `design-quality` for each pass.

**Cohesion beats local polish.** The owner's warning, 2026-11-02: "luego me
haces compras de una manera, ventas de otra... al final es todo de la misma
app". A pass never invents a section-specific layout. It decides the pattern
once, puts it in a shared component (list toolbar, page header, view menu, row
menu, totals bar, empty state), and applies it to every section that has the
same shape, in the same pass or as the next ledger items. A section that ends a
pass looking different from its siblings is a regression, however calm it is.

## Before the first pass

1. **Real data, always.** Fake fixtures hide the problems that matter: a 5,384
   badge, a 40-character supplier name, a total with seven figures. Use the
   project's production mirror or a read-only production view; seed a session
   for a real owner account rather than a test user. Never write to production
   to make a screenshot look right. Outside critics (ChatGPT) see real screens
   only when the owner allows it; otherwise mask names and tax ids while keeping
   their lengths.
2. **The ledger.** Keep `docs/ui-loop.md` in the project (create it on the first
   pass): the doctrine adapted to the product, the **pattern catalogue** (each
   shared pattern, its component, the sections using it), one line per section
   with its state, and the lessons learned. Read it at the start of every pass;
   it is what makes pass N better than pass 1. States: `todo`, `in progress`,
   `blocked <why>`, `technically verified <date> <commit>`, `user validated`.
   Never write `user validated` without the owner or a real user having used it.
3. **Inventory.** List every section from the navigation and group sections by
   shape (list + detail, dashboard, form, report, queue). Rank by (how often
   users open it) x (how cluttered it is). Measure the baseline (see Metrics).
4. **Tasks per section.** Before changing a section, write three tasks in the
   ledger: one for the novice ("find what I still have to pay"), one repetitive
   expert task ("review this quarter's purchases one after another"), and one
   exception ("why does this VAT total not match"). A pass is accepted when the
   novice task got easier and the other two still work, not when a count drops.

## One pass

1. **Capture** the section on real data: desktop 1440x900 and 1280x800, phone
   390x844; the list, a detail and the main form; same company, period, filters,
   tab and scroll before and after.
2. **Outside critique.** `design-quality` propose mode with ChatGPT (or the
   model the owner named), with the owner's complaint quoted verbatim, both
   personas spelled out, and the pattern catalogue so the critic proposes
   app-wide patterns, not one-off screens. Ask for a verdict per control: keep
   visible / secondary behind a named entry / conditional (only when relevant) /
   sequential stage / remove as duplicate. Each critique point names a
   screenshot region; what a still frame cannot prove (focus, latency) is marked
   not assessable. Send critique and mockups to the owner when they arrive.
3. **Choose** changes that apply the doctrine. Extend or create a shared
   component and list every section it will touch. Record rejected proposals in
   the ledger with the reason. Before trimming a default (columns, filters),
   check what else reads it: a list's default columns can also be its export's
   columns, so hiding one silently changes the file an accountant downloads.
   Migrate the siblings in the same pass when the change is mechanical (moving
   an export into "Más" took one component per section); otherwise add them to
   the catalogue's "still to migrate" line.
4. **Build** in the project's design system, then run the project gates
   (type-check, lint, tests, `codeality-ui check` on every route touched).
5. **Prove.** Before/after screenshots of the same state, side by side, plus the
   metrics. Then the **moved-functions manifest**: one line per control that
   moved, with its new entry, operated with mouse and keyboard on desktop and
   phone, and the result seen. A control hidden so well nobody finds it is a
   regression. Run the three tasks.
6. **Ship and show.** Commit and push under the project's rules, send the after
   screenshots to the owner, update the ledger and the pattern catalogue.
7. **Improve this loop.** Write in the ledger what this pass taught. When a
   lesson is general, edit this skill in its source repository in the same
   session, replacing the stale line rather than adding a second one; when it
   changes a rule rather than adds a fact, follow `instruction-ab-test`.

## Tools

`scripts/` holds the measurement kit, Playwright with a saved storage state
(seed a session for the real account; never a password in the file):

- `shot.mjs <state> <out.png> <path> [w] [h] [full]`: one screenshot.
- `count-controls.mjs <state> <path> [w] [h]`: `C_toolbar` as JSON with labels,
  so the before/after list shows which controls moved, not only how many.
- `operate.mjs <state> <path> <prefix> <button>...`: opens each named button,
  screenshots it, presses Escape and prints where focus went: the
  moved-functions manifest. Names match exactly ("Vista" otherwise hits a
  "Buscar vista" palette button).

Set `BASE_URL` and, when the project does not install it, `PLAYWRIGHT_CORE` to a
`playwright-core` directory. An app that scrolls inside `main` needs a tall
viewport (1700px) rather than `fullPage` to show the whole screen.

When the outside critique dies after the answer arrived (an Orca
`runtime_timeout` did on 2026-11-02),
`chatgpt_propose.py <run-dir> --collect <page-id>` recovers the text and the
mockups from the open tab.

Budget: three attempts per section; after that mark it `blocked` with the reason
and move on. Stop when every section is at least `technically verified` or the
owner says so. Under `/loop`, schedule the next pass.

## Doctrine: progressive disclosure

Starting values, to be adjusted per product with evidence, not laws.

- **One primary action per context** (page, panel, dialog), visually dominant.
- **Above the data:** title, primary action, search, period, one "Filtros" and
  one "Vista" entry. "Vista" holds saved views, columns, grouping, density and
  "restablecer". Export, trash, bulk and raw-data tools go in a "Más" menu or
  appear only when rows are selected. On the phone the first screen shows data.
- **Named doors, not junk drawers.** "Columnas", "Desglose de IVA" or "Vista"
  says what is behind it; a "Más" that mixes purposes is a last resort. Every
  hidden thing shows when it is active ("Filtros 2", "Vista: personalizada").
- **Defaults answer the novice** ("what do I have to do?"): the default tab is
  the work queue; zero-count items collapse into one "todo al dia" line; "no
  activity", "no results for these filters" and "no access" stay distinct.
- **Expert density is a remembered choice.** A per-user view preset (like
  QuickBooks' business/accountant view or Linear's display options) changes
  presentation only, never permissions or the meaning of the data, and can be
  reset. Never remove an expert capability; move it.
- **Columns:** start from who, when, what, how much, status; tax ids,
  registration dates and secondary amounts become optional columns or detail.
- **Row actions:** at most two inline when they are frequent; the rest in a row
  menu or the detail. Coloured icon clusters on every row are noise.
- **Totals:** one line with the figure the user acts on; the full breakdown
  opens on demand. Figures that must be compared stay visible together.
- **Navigation:** group by job; rarely used modules collapse or move to
  settings.
- **Words over icons** for anything a newcomer must understand; keep expert
  vocabulary exact and explain it in context rather than replace it.

## Metrics

Auxiliary evidence, never the acceptance criterion on their own.

- `C_toolbar`: controls between the page title and the first data row.
- `C_fold`: interactive controls inside the first viewport, outside navigation.
- Distinct row actions, and primary-styled buttons per context.
- Moved-function coverage: moved controls operated / moved controls (target 1).
- axe violations after opening each new menu, popover and panel: no new ones.

A drop bought by pushing data below the fold or enlarging gaps does not count.

## Rules

- Evidence over taste: each change names what a screenshot shows.
- Never invent data, users, timings or questionnaire answers, and never present
  a feature as existing when it does not.
- Never pass a mockup off as a finished screen: the owner gets real after
  screenshots, and mockups labelled as proposals.
- Keep the domain vocabulary exact (fiscal, legal, medical terms).

Sources and reusable prior art (Impeccable `distill`, NN/g progressive
disclosure, Carbon tables, ux-audit manifests): `references/sources.md`.
