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

## Before the first pass

1. **Real data, always.** Fake fixtures hide the problems that matter: a 5,384
   badge, a 40-character supplier name, a total with seven figures. Use the
   project's production mirror or a read-only production view; seed a session
   for a real owner account rather than a test user. Never write to production
   to make a screenshot look right.
2. **The ledger.** Keep `docs/ui-loop.md` in the project (create it on the first
   pass): the doctrine adapted to the product, one line per section with its
   state (`todo`, `in progress`, `done <date> <commit>`), and the lessons
   learned. Read it at the start of every pass; it is what makes pass N better
   than pass 1.
3. **Inventory.** List every section from the navigation, then rank by (how
   often users open it) x (how cluttered it is). Count the controls visible
   above the first row of data on desktop and on the phone: that number is the
   baseline every pass has to beat.

## One pass

1. **Capture** the section on real data: desktop 1440x900 and phone 390x844, the
   list, a detail and the main form. Note the control count.
2. **Outside critique.** `design-quality` propose mode with ChatGPT (or the
   model the owner named), with the owner's complaint quoted verbatim in the
   prompt and both personas (the novice and the expert) spelled out. Ask for a
   verdict per control: keep visible / behind "Más" / side panel / remove as
   duplicate. Send the critique and mockups to the owner when they arrive.
3. **Choose** the changes that apply the doctrine below. Prefer a change to a
   shared component (toolbar, list frame, page header, navigation) over a
   one-off: one fix then calms every list at once. Record rejected proposals in
   the ledger with the reason.
4. **Build** in the project's design system, then run the project gates
   (type-check, lint, tests, `codeality-ui check` on the routes touched).
5. **Prove** with before/after screenshots of the same route, viewport and data,
   side by side, and the control count before and after. Operate what is hidden:
   open the "Más" menu, the advanced panel, the drawer, on desktop and phone. A
   control hidden so well nobody finds it is a regression.
6. **Ship and show.** Commit and push under the project's rules, send the after
   screenshots to the owner, update the ledger line.
7. **Improve this loop.** Write in the ledger what this pass taught (a pattern
   that worked, a proposal that broke a rule, a capture trick). When a lesson is
   general, not product-specific, edit this skill in its source repository in
   the same session, replacing the stale line rather than adding a second one.

Then move to the next section, or schedule the next pass when running under
`/loop`. Stop when every section in the ledger is `done` or the owner says so.

## Doctrine: progressive disclosure

- **One primary action per screen**, visually dominant. Everything else is
  secondary styling or lives in a menu.
- **Above the data, at most: title, primary action, search, one period or status
  selector, and one "Filtros"/"Vista" entry.** Saved views, columns, grouping,
  export, bulk tools, debug and raw-data buttons go behind those entries. On the
  phone the first screen shows data, not controls.
- **Defaults answer the novice's question** ("what do I have to do?"): the
  default tab is the work queue, empty or zero-count items are hidden or
  collapsed into one "todo al dia" line, and counts are actionable ("23 por
  revisar") rather than raw totals of history.
- **Expert density is a choice, not the default.** A remembered "Vista avanzada"
  or column preset per user keeps the gestoria fast without burdening everyone
  else. Never remove an expert capability; move it.
- **Columns:** five to seven by default (who, when, what, how much, status); tax
  ids, registration dates, secondary amounts become optional columns or appear
  in the detail.
- **Row actions:** one visible action or none; the rest in a row menu or the
  detail. Coloured icon clusters on every row are noise.
- **Totals:** one line with the figure the user acts on; the full fiscal
  breakdown opens on demand.
- **Navigation:** group by job, not by data type; rarely used modules collapse
  or move to settings; the sidebar fits one screen without scrolling.
- **Words over icons** for anything a newcomer must understand; tooltips are not
  explanations.
- **Every hidden thing has a door:** a counted badge ("Filtros 2"), a "Más"
  menu, a keyboard shortcut or the command palette.

## Rules

- Evidence over taste: each change names what a screenshot shows and the control
  count it removes.
- Never invent data or present a feature as existing when it does not.
- Never pass a mockup off as a finished screen: the owner gets real after
  screenshots, and mockups labelled as proposals.
- Keep the domain vocabulary exact (fiscal, legal, medical terms) even when the
  surrounding copy gets simpler.
