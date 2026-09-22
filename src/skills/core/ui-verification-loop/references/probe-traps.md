# Probes that lie, and how each one announced itself

Every entry below was reported as an application bug first. Read this list
before filing a finding; each trap costs a session exactly once.

- **An event dispatched on both `document` and `window`.** A palette that
  toggles open on one and shut on the other looks broken. Dispatch where the app
  listens, once, and confirm with the real trigger control.
- **A screenshot of an occluded window.** WebKit suspends CSS transitions while
  `document.hidden` is true, so a mounting toast stays at opacity 0 forever in a
  snapshot of a background window. Assert on the DOM and computed styles
  instead, or raise the window first.
- **A monkeypatch applied after import.** A module holding a reference it
  captured at import time cannot be observed by replacing that reference later.
  Install instruments at document start.
- **A race in the probe, not the app.** "The dialog did not close" was a read
  issued before the unmount finished. Re-test cleanly before believing a
  negative; state the second reading.
- **Persisted state from a previous run.** A stale row in a drafts table
  restored a months-old body that looked like a live generation bug. Check
  whether what you are seeing was stored, before blaming what produced it.
- **A dev data copy with no credentials.** Everything that needs a provider
  fails, loudly and repeatedly. Those errors are the environment, not the app -
  but the _cadence_ of the retries is fair game, and an unbacked-off retry loop
  found this way was a real defect.
- **Routes you assumed.** A 404 for a path the app never registered is your
  sweep's bug. Read the router before the sweep.
- **A computed `auto` cursor on an anchor.** WebKit decides the hand cursor
  during hit-testing: `EventHandler` branches on `CursorType::Auto` and asks
  `isOverLink()`, so an anchor left at the default reports `auto` from
  `getComputedStyle` while painting a hand. That is the default case only - an
  author `cursor: pointer`, `wait` or `text` still computes what it says, and an
  anchor with no href is not a link. So do not infer a link's painted cursor
  from a computed `auto`, and do not exclude anchors from the audit wholesale:
  inspect their explicit overrides.
- **Focus states read from an unfocused window.**
  `document.hasFocus() === false` alongside `document.hidden === true`
  disqualifies the run as a foreground-interaction test, and every control then
  looks like it has no focus ring. Assert `document.hasFocus()` before believing
  any focus, hover or transition reading. It does not follow that a background
  window cannot be inspected at all: OS focus, page visibility, DOM focus, hover
  and modality are five different states. A probe that only diffs `outline` and
  `boxShadow` around `el.focus()` is weak on its own account - it should read
  `document.activeElement`, `matches(':focus')` and `matches(':focus-visible')`,
  and wait for paint, because `:focus-visible` follows input modality and a
  `transition-all` control has not finished moving when the second read lands.
- **`el.click()` on a component-library trigger.** Radix Tabs 1.1.21 selects on
  left `mousedown`, on Space/Enter, and on focus when activation is automatic -
  it binds no selecting `click` handler, so a plain `el.click()` leaves it
  inert: all seven settings tabs returned the same 3,831 characters and looked
  dead. A single `mousedown` is enough, and a synthetic `pointerdown` alone is
  not (verified against the installed package in jsdom). Keep the rule tied to
  the primitive and its version rather than assuming every trigger behaves this
  way, and remember keyboard activation is an equally valid probe. A real
  WebDriver click sends more than `HTMLElement.click()` does.
- **A linter or baseline pinned behind.** A visual baseline that never moves
  when the UI changes is not proof of stability; check the runner actually ran
  those files.
