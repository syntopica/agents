---
name: ui-verification-loop
description:
  Drives a running UI to find what is broken, slow or empty, asserts what
  actually paints, times the calls behind each screen, and lands the fix.
  Trigger when asked to test an app through its UI, to keep testing until
  nothing is left, to check a screen really renders what it should, or to
  explain why a screen takes seconds. Covers any UI with a JavaScript eval
  channel (web app, Electron, Tauri). Do not use for writing a test suite from
  scratch, for a one-off screenshot, or for reviewing code that is not running.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Verifying a live UI in a loop

A green test suite and a screenshot both lie in the same direction: they show
that something rendered, not that it rendered the truth. This skill is the loop
that closes that gap - drive the real app, assert what it paints, time what it
costs, fix one thing, prove it, record it - and it is written to be extended
every time the loop finds a class of defect it did not know about.

Two things must exist before a tick is worth running. **An eval channel** into
the running app (`references/drivers.md` has the adapter per stack; a Tauri app
on macOS needs the in-process WebDriver route from `tauri-ui-automation`,
because nothing outside the process can touch that window). And **a gate
command** the repository already trusts - the one that must exit 0 before a
commit. Without the gate this becomes a bug-finding loop that ships regressions.

Point the app at a **copy of the data**, never the production store, and shut
the automation surface down when the loop ends. An eval endpoint is remote code
execution against whatever data the window holds.

## One tick

1. **Pick a surface** that has not been swept, or that a previous fix touched.
2. **Probe it** - route sweep, then the assertions below.
3. **Verify the probe before believing the finding.** More than half of the
   first-run "findings" in the sessions behind this skill were the probe's own
   fault. The list is in `references/probe-traps.md`; read it once per loop.
4. **Classify**: real defect, my probe, or environment (dev copy with no
   credentials produces errors that production never sees).
5. **Fix exactly one thing.** A tick that fixes three lands three regressions at
   once and cannot attribute the gate failure.
6. **Run the gate.** Never commit on red. An intentional UI change reddens
   visual baselines: regenerate them and then say _which files moved and which
   did not_ - the untouched ones are the evidence that the change was scoped.
7. **Commit, push, record.** The backlog entry carries the observation, the
   evidence (numbers, not adjectives), and what is left.
8. **Re-arm** and take the next surface.

## What to assert, per surface

Rendering, in order of how often each one has actually been wrong:

- **It paints its own data.** An empty list, a zero count, a skeleton that never
  resolves, and "Not available yet" chrome on a shipping screen are all the same
  finding: the screen is not carrying its weight. Read the text content, do not
  eyeball a screenshot.
- **It paints the right data for the route.** The most expensive class, because
  it looks correct. A shared component rendered on a folder route still showed
  the inbox's unread counts and called itself "All inboxes"; every number on
  screen was real, and every one of them described mail the page was not
  showing.
- **The console ring is clean.** Install a capture-phase ring (snippet in
  `references/drivers.md`) and read it after every sweep. Duplicate React keys,
  failed resource loads and unhandled rejections surface here and nowhere else.
  A resource that fails to load fires a non-bubbling error on the element, so
  only the capture phase sees it - without that, a dead dev server is
  indistinguishable from a blank page with no errors.
- **Both themes.** Set the theme the app itself persists, reload, and re-read.
  Light-on-light toasts, a component library defaulting to its own light
  surface, and a filtered iframe whose canvas is painted outside the filter have
  all shipped this way.
- **The text is not mangled.** Grep rendered bodies for `Ã`, `â€`, `Â` - a UTF-8
  payload read through a single-byte charset. Found in 252 of 120,458 stored
  mail bodies on a store nobody had complained about.
- **Interactive states exist.** Cursor, hover, focus-visible, disabled, and a
  pending state on anything async. Tailwind v4's Preflight sets buttons to
  `cursor: default`, so "no pointer anywhere" is a one-line base-layer fix, not
  a per-component hunt.

## Measuring, not guessing

Every screen that feels slow gets **three numbers**, and the third is the one
that finds the cause:

| Number     | How                                        | What it tells you                             |
| ---------- | ------------------------------------------ | --------------------------------------------- |
| Cold       | First call after launch                    | What a user meets                             |
| Warm       | Same call again                            | Whether caching works at all                  |
| Out-of-app | Same query/request outside the app process | Whether the work is slow, or only slow _here_ |

A query measured at 158s through the app and 0.4s against the same file through
the CLI is not a slow query - it is contention, and the fix is in whatever
serialises access, not in the SQL. That gap is the single highest-value
measurement in this skill. Stack-level tools tell you who holds the lock
(`sample <pid>` on macOS); every waiting thread parked in the same read lock is
the answer.

Also count, not just time: **how many calls a route fires**. One per row is a
finding regardless of how fast each one is. Wrap the app's own transport (the
IPC invoke, `fetch`, the query client) and read the counter after a navigation.

What has actually fixed these, in order of payoff: stop background work from
scanning everything on a short timer (make its duty cycle proportional to what
it costs); give a polling reader its own connection instead of sharing the pool;
delete work the screen never shows; only then touch the query.

## Landing the fix

Same repository rules as any other change - one logical change per commit, the
gate green before it, the backlog updated with evidence. Two habits specific to
this loop:

- **Re-verify live, in the app, after the fix.** The gate proves the code is
  consistent; only the running UI proves the screen is right. Read the text back
  through the eval channel and quote it.
- **Say what you did not verify.** DOM-level clicks prove application logic,
  routing and state. They do not prove native hit-testing, real keyboard
  shortcuts, IME composition, drag and drop, or OS dialogs.

## Keeping this skill honest

The catalog in `references/finding-catalog.md` is the point of the loop. After a
tick that found something the checks above would have missed, add a row: the
class of defect, the probe that detects it in one call, and the evidence that it
was real. A row earns its place only if the probe is cheap and the finding was
confirmed, not suspected. When a check turns out to produce false positives,
edit it rather than leaving it to be re-learned - `references/probe-traps.md`
exists because every entry in it cost a session the first time.
