# Playwright `--extension` MCP on a real Chrome tab

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
