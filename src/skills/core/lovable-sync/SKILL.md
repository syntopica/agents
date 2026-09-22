---
name: lovable-sync
description:
  Implements design parity between a Lovable project and the real app repo, in
  either direction, wiring real data behind the ported UI. Trigger when the ask
  involves a Lovable repo or design, porting a Lovable design into the app, or
  pushing the app's design to Lovable. Triggers (ES) are paridad lovable, diseño
  de lovable, migrar el diseño, que se vea como en lovable. Do not use for
  writing Lovable prompts, general frontend styling without a Lovable source, or
  debugging unrelated UI bugs.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [direction-or-scope]
---

## Rules

- Pull the latest state of the source side before comparing anything. A stale
  Lovable checkout or an old app build makes every difference finding wrong.
- Parity is visual and structural, never destructive. Existing functionality in
  the target (real data wiring, handlers, edge cases like IMAP folders) survives
  even when the Lovable design lacks it; port the look, keep the behavior.
- Lovable output is chrome, not truth. Its mocked data, fake handlers, and
  placeholder flows must be wired to the app's real data and actions, or
  explicitly listed as not yet wired.
- Work in mapped slices (screen, section, or component), verifying each rendered
  result against the source design before moving to the next; never a single
  big-bang restyle.
- When the two sides genuinely conflict (the app needs something the design
  forgot), keep the app's need and record the deviation instead of silently
  dropping either.

## Workflow

1. Establish direction and scope. Lovable to app, or app to Lovable, and which
   screens are in this pass. Pull or download the latest version of the source
   side.
2. Build the difference map. For each screen in scope, list what differs
   (layout, tokens, components, copy) and what the target has that the source
   lacks (functionality to preserve).
3. Port slice by slice. Apply the design, wire real data and handlers behind it,
   and check the rendered result against the source before taking the next
   slice.
4. Track the not-yet-wired remainder explicitly (mocked pieces, missing
   endpoints, deliberate deviations) so parity progress is measurable instead of
   "looks close".
5. Close by reporting parity state per screen and recording the remainder in the
   project's backlog.

## Output

- Return: the difference map, the slices ported this pass with their
  verification, the functionality preserved against the design, deliberate
  deviations, and the not-yet-wired remainder recorded to the backlog.
