---
name: tauri-ui-automation
description:
  Inspecting, clicking or screenshotting a Tauri v2 desktop app's own window
  from an agent on macOS. Trigger when a UI change in a Tauri app needs visual
  or DOM verification, when AppleScript or a synthetic click has just failed
  silently, and before adding any automation surface to a desktop app. Do not
  use for web pages in a browser, for headless Playwright runs against a dev
  server, or for native hit-testing, IME or drag-and-drop, which this cannot
  test.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Driving a Tauri v2 UI: from inside the process, never from outside

The blocker is macOS, not Tauri. A session's terminal has no Accessibility
grant, so AppleScript reports zero windows even for Finder and a synthetic
`CGEventPost` click is swallowed with no error. `screencapture` still reads
pixels. That floor - see and never touch - is what ships UI changes unverified.

**The one route that works: run a WebDriver server inside the app process.**
`tauri-plugin-wdio-webdriver` (crates.io, 1.4.0, requires `tauri ^2.10`) reaches
the real `WKWebView` through `WebviewWindow::with_webview` and
`evaluateJavaScript` / `takeSnapshotWithConfiguration`. Nothing is driven from
outside the app, so no TCC grant is involved at all - not Accessibility, not
Automation, not Screen Recording. That is the whole reason it works.

## Do not re-research these

Each was checked against upstream source, 2026-09-10:

- `tauri-driver`, the documented WebDriver path, **has no macOS backend**. It
  wraps `msedgedriver` and `WebKitWebDriver`, Windows and Linux only.
- `isInspectable = true` opens **no CDP port**. WebKit's remote inspector is
  Mach/XPC behind a private entitlement, not DevTools over TCP.
- iOS inspector proxies (`ios-webkit-debug-proxy` and friends) bridge a device
  service desktop `WKWebView` does not expose.
- TCC cannot be granted non-interactively. `tccutil` only resets; a PPPC profile
  needs user-approved MDM.

## Wiring it in

1. **Default-off cargo feature.** Cargo cannot bind a dependency to the debug
   profile - `[target.'cfg(debug_assertions)'.dependencies]` silently does
   nothing - so a feature is the only mechanism available.
2. **`compile_error!` on feature-plus-release**, in its own module file (in a
   barrel `mod.rs` or `lib.rs` a strict one-unit-per-file linter flags it as
   logic). Prove it fires once by compiling with `debug_assertions` off.
3. **Register the plugin** with `init_with_port(port)` in the builder, behind
   `#[cfg(feature = "...")]`.
4. **Console capture**: a second plugin using
   `tauri::plugin::Builder::js_init_script` - _not_ `initialization_script`,
   which lives on the webview builder - installing a document-start script that
   pushes into a bounded ring on `window`.
5. **A launcher script** that exports the gate variables, points the app's data
   directory at a scratch copy, refuses a busy port, and **reuses** a dev server
   already listening rather than killing another session's (see
   `orphan-process-cleanup`).

## Four gates, non-negotiable

The server is unauthenticated and exposes a **sessionless `/wdio/eval`**:
anything reaching the port evaluates arbitrary JavaScript in a window holding
real user data. Gate it four ways, each failing closed:

- the default-off feature;
- the `compile_error!` on release;
- a startup check demanding an explicit opt-in variable, an explicit port and an
  explicit data directory, aborting before the store is opened;
- a data-directory check that **canonicalizes** the path and refuses the
  production identifier. Canonicalizing is what defeats a symlink aliasing
  production.

Point it at a copy, and shut it down when the session ends. The copy still holds
real data.

## Using it

Open a session once and keep the id; every other call needs it.

```sh
SID=$(curl -s -H 'Content-Type: application/json' \
  --data '{"capabilities":{"alwaysMatch":{}}}' \
  http://127.0.0.1:4445/session |
  python3 -c "import json,sys; print(json.load(sys.stdin)['value']['sessionId'])")
B=http://127.0.0.1:4445/session/$SID

curl -s -H 'Content-Type: application/json' \
  --data '{"script":"return document.body.innerText.slice(0,800);","args":[]}' \
  "$B/execute/sync"

EID=$(curl -s -H 'Content-Type: application/json' \
  --data '{"using":"css selector","value":"a[href=\"/#/inbox\"]"}' "$B/element" |
  python3 -c "import json,sys; print(list(json.load(sys.stdin)['value'].values())[0])")
curl -s -H 'Content-Type: application/json' --data '{}' "$B/element/$EID/click"

curl -s "$B/screenshot" | python3 -c "
import json,sys,base64
sys.stdout.buffer.write(base64.b64decode(json.load(sys.stdin)['value']))" > shot.png
```

Hash routing means WebDriver's `link text` strategy finds nothing; select route
links as `a[href="/#/inbox"]`. Editing any Rust file restarts the app under
`tauri dev` and **invalidates the session id** - re-open it after every backend
edit.

## What this proves, and what it does not

Clicks are `el.click()`; typing is the native value setter plus dispatched
`input`/`change`. React reacts correctly, so application logic, routing,
rendering and state are genuinely verified. Native hit-testing, keyboard
shortcuts, IME composition, drag-and-drop and OS dialogs are **not**, and the
screenshot is the webview alone - no title bar, no native menu. Say which of the
two a claim rests on.

Add a **capture-phase** `error` listener to the console ring alongside the
`console.error`/`warn` wrappers and `unhandledrejection`. A script or stylesheet
that fails to load fires a non-bubbling error on the element itself, so only the
capture phase sees it; without it a dead dev server is indistinguishable from a
blank page with no errors, which once cost an hour spent hunting a nonexistent
app bug.

Before believing a finding, check the app's own event and cache semantics rather
than your probe: an event dispatched on `document` without bubbling is invisible
to a `window` listener, and a module that captured a reference at import time
cannot be observed by monkeypatching that reference afterwards. Both produced
confident false negatives on the first run.

Reference implementation: `src-tauri/src/automation/` and
`docs/ui-automation.md` in the Consumer-o repository. Background and the full
dead-end record: `brain/topics/tauri-ui-automation.md`.
