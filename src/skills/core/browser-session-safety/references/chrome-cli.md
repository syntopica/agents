# The real Chrome through chrome-cli

Read only for reading a tab without focus, or the day the owner explicitly asks
for Chrome.

1. **chrome-cli first** (`/opt/homebrew/bin/chrome-cli`) for anything it
   answers: list, open, close and activate tabs and windows across every
   profile, navigate, reload, `source`, `execute <js>`. One Bash call, no MCP
   session. Wrap `execute` in `timeout 25`.

   **Never pass `-t <tab-id>` to `execute`.** It fails with "No matching handler
   found" every time; without the flag the identical script on the identical tab
   returns its value (measured 2026-09-08). The error names nothing real, so it
   reads like a permissions or multi-instance problem and sends you chasing
   "Permitir JavaScript desde Eventos de Apple", stray Chrome processes and CDP
   ports - a whole session was lost to that once. `execute` runs against the
   **active tab of the frontmost window**, so the working shape is: open the URL
   in the right identity, raise that window, then call `execute` bare.

   **Always return a string from `execute`.** A script whose last expression is
   a number or `undefined` crashes chrome-cli with
   `-[__NSCFNumber UTF8String]: unrecognized selector` and a full Objective-C
   stack — the JavaScript already ran, so the work is done and only the reply is
   lost, but the trace reads like a broken browser. Wrap the result in
   `String()` or end with a literal (measured 2026-09-11).

**To READ a tab, never take the focus: `chrome-cli source -t <tab-id>`.** This
is the answer to sessions fighting over tabs, and it is the one route that does
not compete at all — it returns that tab's hydrated DOM wherever the tab sits,
in any window, on any profile, with nothing raised and nothing stolen from
whoever is working in the front window. Pair it with
`chrome-cli info -t <tab-id>`, which prints that tab's title and URL, so you can
confirm you have the right tab before reading it and map ids to URLs afterwards.
Measured 2026-09-11 on a Medium article behind a paid membership: 296 KB of
rendered DOM, no focus change.

Everything else tried that day failed, and each failure is silent or expensive:

- **`execute` read someone else's page.** It acts on the active tab of the
  frontmost window, which was a password-manager service-account wizard, and it
  returned that page's text as though it were the article. Nothing errors. You
  get a plausible answer about the wrong page, which is the worst shape a
  failure can take.
- **Raising a chosen window failed twice** — an AppleScript
  `set index of (first window whose id is N) to 1` followed by `activate`, and
  `chrome-cli activate -t <tab-id>`. The password manager window kept the front
  in both cases. Do not build a read on top of a raise, and if you do raise,
  verify with `chrome-cli info` before acting rather than assuming it took.
  **The flag that does raise it is `--focus`**:
  `chrome-cli activate -t <id> --focus` brought a background window to the front
  on 2026-09-23 where the AppleScript above had just failed on the same window.
  It is in `chrome-cli --help` and was missed for a year.
- **A raise you won is not a raise you keep.** With the owner at the keyboard
  the same night, the front window changed back between two consecutive
  `execute` calls, and the second landed on his X timeline while the script
  still believed it was on a Stripe settings page. So make every `execute`
  self-guarding: begin the script with
  `if (!location.href.includes("<the page you mean>"))` and return the wrong URL
  instead of acting. The guard costs one line and is the only thing that turns
  this failure from silent into visible — it caught the very next call. When the
  owner is actively browsing, stop driving their Chrome rather than racing them
  for the front window.
- **The Playwright extension MCP hung on `browser_tabs list`**, past 120 s, on a
  Chrome holding hundreds of tabs. Same shape as the `chrome-devtools`
  `--autoConnect` trap: tab enumeration is what does not scale here.

The division to keep in mind: **reading a page that has already rendered needs
no focus, and interacting with one does.** Scroll-driven capture, clicking and
form-filling still go through `execute` and therefore still need the front
window, which is exactly when to confirm whose window it is. A read has no such
excuse.

**`execute` follows the owner's tab switches, so never drive a fill while they
are using Chrome.** On 2026-09-22 a form tab opened with `chrome-cli open -w` in
the front window was the active tab for one call; the owner switched back to X
between two calls, and the next `insertText` typed the location query into X's
search box (cleared by hand, nothing sent). Before every write call, read
`chrome-cli info` and abort when the tab id is not the one you opened; if the id
changes once, stop the fill and hand the remaining fields to the owner, because
a second write will land in their page too. A tab switch you did not make is the
signal that the owner is at the keyboard.

To find the tabs you opened without touching anyone else's, diff
`chrome-cli list tabs` before and after your `open -na`, then close only the ids
that appeared.

**`open -na` does not open a new window.** It reuses an existing window of that
profile and adds a tab to it, so the window you think you created is the user's,
with their tabs in it. Never close a Chrome window by id to tidy up after
yourself: count its tabs first, and prefer leaving it open.

```bash
open -na "Google Chrome" --args --profile-directory="Profile 2" "<url>"
osascript -e 'tell application "Google Chrome"
  activate
  repeat with i from 1 to count of windows
    if id of window i is <WINDOW-ID> then set index of window i to 1
  end repeat
end tell'
timeout 25 chrome-cli execute 'document.body.innerText.slice(0,2000)'
```

This reads and drives **SPAs**, which is what makes it worth preferring:
`source` returns the served shell, `execute` sees the rendered DOM, so an
Angular console like Google Play answers the second and not the first. Read with
`innerText`, find controls by their text, and click them with `.click()` rather
than coordinates. Three routes that look plausible for SPA work and are not:
Chrome does not expose its accessibility tree unless an assistive technology is
attached, no CDP port listens by default, and copying a profile's cookies into
another Chrome profile does not carry a Google session - those are bound to the
device and profile on purpose, and moving them around is session handling you
should not be doing anyway. With two Chrome instances running (a
Playwright-launched one beside the real one) AppleScript may resolve "Google
Chrome" to the wrong process; chrome-cli still hits the real one.
