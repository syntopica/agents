# Review rubric

Read each screenshot against these sections in order. Every item you report
names what is visible and why it costs the person using the screen.

## 1. Job

- What is this screen for, in one line? Who opens it, how often, looking for
  what? Every later judgement is relative to this answer.
- Is the most frequent task the most visible one? One primary action per view.

## 2. Hierarchy

- The eye lands on the right thing first: page title, then the content, then
  secondary chrome. Squint test on the screenshot.
- Type scale: a handful of sizes with clear steps (for example 12/14/16/20/24),
  not several sizes 1-2px apart. Weight and colour carry hierarchy before size
  does.
- Muted text is still readable (the contrast rule covers the ratio; you judge
  whether muted was the right choice for that content).

## 3. Layout and rhythm

- One spacing scale (4 or 8px steps) used consistently; equal things have equal
  gaps.
- Repeated items line up on shared tracks: tables or grid columns for list data.
- The layout uses the width it has on desktop for data-heavy screens; reading
  text keeps a measure of roughly 60-80 characters.
- Controls breathe inside their bars and cards; nothing touches an edge it
  should not.

## 4. Density for data screens

- Lists of records: is each row scannable in one glance (who, what, when,
  status)? Fixed columns, right-aligned numbers and times, consistent row
  height.
- The information needed to decide is on the row, not one click away.

## 5. Consistency

- One style per kind of thing: buttons, badges, icons (one set, one stroke),
  radii, shadows. Brand colour used for brand moments, semantic colours
  (success, warning, danger, info) used for meaning, and both from tokens.
- Same data formatted the same way everywhere (dates, money, names).

## 6. States (the usual "missing")

- Empty (first use and no results), loading (skeleton, not a spinner over a
  blank page), error with a way out, partial data, very long text, very many
  items, unread or new, selected, disabled.
- Hover, focus-visible and active states on everything clickable; the whole row
  is clickable when the row is the target.

## 7. Controls and navigation

- Lists that grow: search, filters, sort, pagination or virtualisation, counts.
- Bulk actions when the job is triage; keyboard shortcuts for daily-use screens.
- Current location visible in the navigation; the page title matches it.

## 8. Content

- Labels say what the thing is in the user's words; no placeholder text or
  developer strings ("[media message]", "Sin nombre") reaching the screen
  without a deliberate design for them.
- Truncation keeps the start, shows an ellipsis and offers the full text.
- Relative times for recent events, absolute on hover.

## 9. Responsive and dark

- Phone screenshot: no sideways scroll, targets at least 44px, nothing hidden
  that the job needs.
- Dark screenshot: either a real dark theme or none; never half (light surfaces
  with dark-mode text).

## 10. AI-made tells

- Gradient text, purple-blue gradients, glassmorphism, glow shadows, emoji as
  icons, generic hero sections on an internal tool, cards inside cards, every
  section the same card. Name them only when they hurt the job or the brand.
