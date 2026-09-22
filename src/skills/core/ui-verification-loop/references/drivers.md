# Getting an eval channel, and what to install through it

Every assertion in this skill is "evaluate JavaScript in the running window and
read the result back". Pick the adapter, then install the two instruments.

## Adapters

- **Web app in a real browser** - drive the user's own Chrome through the
  browser tooling the machine already has, and read `browser-session-safety`
  first. Never substitute a fresh or temporary profile for a logged-in site.
- **Web app, no login needed** - a headless Playwright or CDP session is fine
  and is the cheapest channel: `page.evaluate` is the eval, `page.screenshot`
  the pixels.
- **Electron** - the renderer exposes CDP on `--remote-debugging-port`; attach
  to the page target, not the browser target.
- **Tauri on macOS** - nothing outside the process can drive the window: without
  an Accessibility grant AppleScript sees zero windows and a synthetic
  `CGEventPost` click is swallowed. Invoke `tauri-ui-automation` for the
  in-process WebDriver route and the four gates that keep it out of a release
  build.

Whatever the adapter, hash routing means WebDriver's `link text` strategy finds
nothing; select route links by `a[href="/#/inbox"]`. And know the app's real
routes before calling one a 404 - a sweep that invents paths reports the
sweeper's bugs.

## Instrument 1: the console ring

Install at document start, before app code runs, so nothing is missed:

```js
window.__RING__ = []
const push = (level, text) =>
  window.__RING__.push({
    level,
    text: String(text).slice(0, 500),
    at: Date.now(),
  })
for (const level of ['error', 'warn']) {
  const original = console[level].bind(console)
  console[level] = (...args) => {
    push(level, args.join(' '))
    original(...args)
  }
}
addEventListener('unhandledrejection', (e) => push('error', e.reason))
addEventListener(
  'error',
  (e) => push('error', e.message || e.target?.src),
  true,
)
```

The `true` on the last listener is not optional: a script or stylesheet that
fails to load fires a **non-bubbling** error on the element itself, so only the
capture phase sees it.

## Instrument 2: the call counter

Wrap the app's own transport before navigating, then read the counter after the
screen settles. The shape differs per stack - `fetch`, the Tauri IPC invoke, the
query client - but the assertion is the same: a route that fires one call per
rendered row is a finding whatever each call costs.

```js
window.__CALLS__ = []
const original = window.fetch
window.fetch = async (...args) => {
  const started = performance.now()
  try {
    return await original(...args)
  } finally {
    window.__CALLS__.push({
      url: String(args[0]),
      ms: performance.now() - started,
    })
  }
}
```

Wrap before the screen mounts. A module that captured the transport reference at
import time will not see a later monkeypatch, which reads as "zero calls" and is
a false negative, not a fast page.

## Reading the result

Prefer text over pixels for assertions: `document.body.innerText` and the text
of the specific pane answer "did it paint the right thing" directly, survive
being quoted in a backlog entry, and cost nothing. Take the screenshot for
layout, clipping, contrast and anything about paint order - and remember it is
the web view alone, with no native chrome.
