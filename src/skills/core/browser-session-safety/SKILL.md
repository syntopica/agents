---
name: browser-session-safety
description:
  Driving or troubleshooting a browser — Orca's embedded browser first and
  always, then chrome-cli, Playwright MCP, Chrome profiles and identities, and
  reading or clicking a logged-in page. Trigger when a task is about to issue
  its first browser command, when a browser action fails for want of an identity
  or a login, and when a window or tab that is not certainly yours is about to
  be closed. Do not use for fetching a public URL or for headless test runs of
  your own app.
allowed-tools: Read, Grep, Glob, Bash
---

# Browser control: Orca always, the real Chrome only to read, never a fresh profile

Owner order, 2026-09-25: "usa orca browser como primario siempre... que no me
roba el foco". The real Chrome carries what an automation browser cannot
reproduce: many authenticated profiles, the password manager extension in each,
and the trusted-device state banks demand. That is why a login missing in Orca
is fixed by importing the Chrome profile into Orca, not by driving Chrome. A
browser launched with a temporary or isolated profile has none of it and is
unusable for any logged-in site, so do not launch one for that.

0a. **Every browser task runs in Orca's embedded browser** (owner decision
2026-09-23, "always when you can" on 2026-09-24, "siempre" on 2026-09-25):
application forms, public boards, anything an API does not cover, and every
logged-in site. When no Orca profile holds the login (typically Google SSO or
GitHub with no password on record), ask the owner to import that Chrome profile
into Orca through its UI (the CLI cannot) or to sign in inside Orca's browser;
do not fall back to Chrome, not even with the screen locked. On 2026-09-24 a
Resend SSO login went through Chrome Profile 18 when an import would have kept
it in Orca; on 2026-09-25 a session logged into Product Hunt through the real
Chrome with the screen locked, and the owner was back at the keyboard on another
tab before the next write, which is exactly the focus theft the order forbids.
The Chrome sections below stay for reading (`chrome-cli source -t`, `info -t`,
which take no focus) and for the day an owner explicitly asks for Chrome.
`orca tab create --url`, `snapshot`, `fill`, `upload`, `click`, `eval`; full
command list in the `orca-cli` skill. It shares no tab and no focus with the
owner, so none of the traps below apply, and Ashby's bot gate accepted it where
a Playwright-launched Chrome was refused. It also holds the sessions imported
from the real Chrome through Orca's UI: `orca tab profile list --json` lists
them (Cristian as `default`, Favish, BusiRocket; imported 2026-08-08), and on
2026-09-23 Favish and BusiRocket still carried a live LinkedIn `li_at` while
`default` landed on the authwall. Switch a tab with
`orca tab profile set --page <browserPageId> --profile <id>` and confirm with
`orca cookie get` before reading the page as logged in;
`orca tab profile create --scope imported` only creates an empty profile, the
import itself is a UI action the owner does in one step, so ask for it rather
than reaching for the real Chrome below.

0. **Before any of this, ask whether the site has an API key here.** Discord is
   the measured case: an instance that already owns a bot token (recorded in its
   wiki under the API page) reads and posts through the API, so
   `GET /channels/<id>/messages?limit=N` with `curl` returns a channel's
   messages as clean JSON — author, timestamp, embeds — with no tab, no focus
   and no profile question. On 2026-09-16 a session opened Discord in Chrome and
   scraped the rendered DOM instead, because it never consulted the wiki. Check
   the instance's access map first; drive the browser only for what has no API.

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

2. **Playwright `--extension` MCP for the rest**: DOM snapshots and element
   interaction, screenshots, network, console on a real tab, connected through
   the Playwright Extension installed in three Chrome profiles. Each server's
   env carries one profile's connection token, so it attaches with no dialog,
   and the server name says which Chrome profile it reaches: under each Claude
   profile, `playwright-chrome` is that account's own Chrome profile, and the
   named servers reach the others. The three tokens are recorded in the brain's
   access map (`business/access-map.md`, Chrome profiles section). Each server
   works on one selected tab at a time: `browser_tabs` lists what is reachable,
   and other tabs join by being dragged into its tab group. The
   `chrome-devtools` MCP launches its own persistent profile instead; keep it
   for our own apps and for traces, not for logged-in sites. Do not attach it to
   the real Chrome with `--autoConnect`: it auto-attaches to every one of the
   hundreds of open tabs and never answers. Claude in Chrome only acts inside
   its own tab group and needs a manual Connect per profile, so it is the last
   of these. Two traps measured on 2026-09-22 while filling an Ashby form
   through `playwright-chrome`:

   - **1Password closes the tab when a `type=email` input takes focus.** Every
     route into it — `locator.click()`, `locator.fill()` and the first key event
     — came back as `Target page, context or browser has been closed` or
     `Protocol error (Input.dispatchKeyEvent): Detached while handling command`,
     four times in a row, losing a filled form each time. Setting
     `data-1p-ignore` on the input from `page.evaluate` before focusing it stops
     it, and that is also what names the cause. Every other field typed
     normally, so read a tab that dies on one specific field as the password
     manager, not as a broken relay.
   - **`page.keyboard.insertText` detaches the tab outright** on this transport.
     Real key events (`pressSequentially`) work, so type the text; a 1,500
     character answer costs about twenty seconds at a 12 ms delay.

   - **The relay spawns Chrome with `--profile-directory=<profile-dir-name>`,
     which defaults to `Default`, so a server whose token belongs to another
     profile never connects.** Measured 2026-09-22 under the secondary Claude
     profile: `playwright-chrome` (Profile 1 token) and `playwright-busirocket`
     (Profile 2 token) both failed with
     `Playwright extension did not connect within 30s … Chrome profile "Default"`,
     and every connect page landed in the Default window. One attempt connected
     when a Profile 2 window had just been opened with
     `open -na … --profile-directory="Profile 2"`, and it dropped again once
     another window took the front, so that is not a route. Re-opening the
     connect URL in the right profile within the 30 s window did not connect
     either. The fix is `--profile-dir-name "Profile 2"` in that server's `args`
     (both profile configs), which needs a session restart; until then use the
     persistent agent profile below for boards without a bot check, and close
     the connect tabs the failed attempts leave behind (fourteen on 2026-09-22).
   - **The `chrome-devtools` MCP profile is one browser for the whole machine**:
     `The browser is already running for ~/.cache/chrome-devtools-mcp/chrome-profile`
     means another session holds it. Do not stop that browser; launch
     `~/.agent-chrome/<identity>` instead.
   - **A tab that is not in the front window gets no keystrokes.** With the
     relay tab hidden (`document.hidden === true`) behind the owner's window,
     `pressSequentially` typed nothing and screenshots timed out, while
     `page.fill`, `page.evaluate`, in-page `.click()` and the network log all
     worked. Drive a hidden tab with fill and DOM events, never with key events,
     and never raise the window to fix it: the owner's front window is theirs.

   `browser_run_code_unsafe` echoes the whole script back in its result, so a
   script with a base64 file embedded blows the result limit and lands in a
   tool-results file. Keep the verification the script returns small and read it
   from that file's first few hundred bytes.

3. **A separate browser only when unavoidable** (parallel runs, tests of our own
   app that must not touch real sessions), and then always a persistent profile
   on the real Google Chrome binary with the password manager extension
   installed there once: the `chrome-devtools` MCP's own profile, or
   `~/.agent-chrome/<identity>`. Never `--isolated`, a tmp user-data-dir, or
   bundled Chromium for a logged-in site. CDP on the default user-data-dir needs
   the `chrome://inspect/#remote-debugging` toggle and a permission dialog per
   client; on any other directory it needs `--user-data-dir` (Chrome 136+).
4. Orca's embedded browser is driven through the `orca-cli` skill, and desktop
   app windows or webviews outside Chrome through `computer-use`.
