---
name: browser-session-safety
description:
  Driving or troubleshooting a browser, Orca's embedded browser first, then
  chrome-cli, Playwright MCP, Chrome profiles and logged-in pages. Trigger when
  a task is about to issue its first browser command, when a browser action
  fails for want of an identity or a login, and when a window or tab that is not
  certainly yours is about to be closed. Do not use for fetching a public URL or
  for headless test runs of your own app.
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

**Load this once per session.** It does not change between browser commands, so
a second load in the same conversation buys nothing. A subagent that only drives
Orca does not need it either: put the brief below in its prompt instead.

Subagent brief, verbatim: _Browser work runs only in Orca's embedded browser
(`orca tab ...`, see the `orca-cli` skill). Check `orca tab profile list --json`
for the login; if none holds it, stop and report, never fall back to the real
Chrome or a fresh/isolated profile. The real Chrome may only be read with
`chrome-cli source -t <id>` / `info -t <id>`. Prefer an API from the access map
over any browser._

0a. **Every browser task runs in Orca's embedded browser** (owner decision
2026-09-23, "always when you can" on 2026-09-24, "siempre" on 2026-09-25):
application forms, public boards, anything an API does not cover, and every
logged-in site. When no Orca profile holds the login (typically Google SSO or
GitHub with no password on record), ask the owner to import that Chrome profile
into Orca through its UI (the CLI cannot) or to sign in inside Orca's browser;
do not fall back to Chrome, not even with the screen locked. On 2026-09-24 a
Resend SSO login went through the imported Chrome profile when an import would have kept
it in Orca; on 2026-09-25 a session logged into Product Hunt through the real
Chrome with the screen locked, and the owner was back at the keyboard on another
tab before the next write, which is exactly the focus theft the order forbids.
The Chrome references (1 and 2 below) stay for reading (`chrome-cli source -t`,
`info -t`, which take no focus) and for the day an owner explicitly asks for
Chrome. `orca tab create --url`, `snapshot`, `fill`, `upload`, `click`, `eval`;
full command list in the `orca-cli` skill. It shares no tab and no focus with
the owner, so none of the Chrome traps apply, and Ashby's bot gate accepted it
where a Playwright-launched Chrome was refused. It also holds the sessions
imported from the real Chrome through Orca's UI: `orca tab profile list --json`
lists the profiles configured in the private instance. Switch a tab with
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

1. **The real Chrome, only to read or on explicit owner request.**
   `chrome-cli source -t <tab-id>` and `info -t <tab-id>` read any tab without
   focus. Before any `execute`, open, close or window command, read
   `references/chrome-cli.md`: `-t` breaks `execute`, it acts on the frontmost
   window, and closing a window can kill another session's tabs.

2. **Playwright `--extension` MCP** reaches real Chrome profiles for DOM
   snapshots, screenshots, network and console. Before its first call, read
   `references/playwright-extension.md` (per-profile servers, tab groups, file
   uploads, result-size traps).

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
