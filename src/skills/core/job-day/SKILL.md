---
name: job-day
description:
  Executes one day's job-hunt round over the dev mailbox, jobradar and X.
  Trigger when the ask is to spend another day looking for work, to check
  whether anything new arrived, or to run the daily round rather than one named
  posting. Triggers (ES) are busquemos trabajo un dia mas, mira si hay ofertas
  nuevas, ronda diaria. Do not use for filling or submitting one form (that is
  job-application) or for looking up a single posting (that is job-search).
allowed-tools: Read, Grep, Glob, Bash, WebFetch, TodoWrite
argument-hint: [none]
---

# Job day — the daily round

Four sources, in this order. The point of the order is that the first two carry
deadlines and the last two only carry leads: an assessment invite with a 7-day
clock outranks a new posting every time.

Everything lands in
`~/p/cristian-deluxe-developer-portfolio/career/applications/tracker.csv`, which
is the system of record. A lead that is not a row in it did not happen.

## 1. The dev mailbox — replies first, alerts second

```bash
vexa messages --account me@cristiandeluxe.dev --since <last-round-date> --limit 200
```

`vexa messages` sorts **oldest arrival first** and defaults to 20, so a bare
`--limit` returns months-old mail and reads like an empty inbox. Always pass
`--since`. `vexa search` takes no `--since` and buries a recent ATS mail under
years of newsletters; filter a dated `messages` dump instead.

Read a message by its id, which `--json` gives you and the table does not:

```bash
vexa --json messages --account me@cristiandeluxe.dev --since <date> --limit 200
vexa message "<id>"
```

Two classes matter and they are not the same:

- **A human or an ATS answering us** — an assessment invite, a recruiter
  question, a scheduling mail. These have clocks. Toggl's Ashby invite
  (2026-09-09) closed the application in 7 days of silence.
- **Alert mail** (`jobalerts-noreply@linkedin.com`, `jobs-noreply@`). Leads
  only, and mostly ineligible. Never trust the location in the alert: resolve
  the company's canonical board and read the requisition's own location list.
  Anthropic's "Staff+ Full-stack" alert was a San Francisco / New York / Seattle
  requisition; every Anthropic EMEA req is London or Dublin.

A Greenhouse board answers the eligibility question in one call:

```bash
curl -s "https://boards-api.greenhouse.io/v1/boards/<slug>/jobs" |
  python3 -c "import json,sys;[print(j['title'],'::',j['location']['name'],'::',j['absolute_url']) for j in json.load(sys.stdin)['jobs'] if 'Spain' in j['location']['name']]"
```

## 2. The recruiter answer is probably on WhatsApp

Before flagging an unanswered recruiter question, check WhatsApp Desktop. The
owner moves recruiter threads there and the email side stays silent. Schema,
paths and the Apple-epoch offset are in the `whatsapp-desktop-sqlite` memory of
the portfolio project. Asking him something he already answered is the single
most repeated failure of this round.

## 3. jobradar

```bash
bash ~/p/jobradar/bin/jobradar-daily.sh
cat ~/.local/state/jobradar/$(date +%F).log
cat ~/p/jobradar/digest/$(date +%F).md
```

The script builds, sweeps, scores and writes the digest; a stage failing does
not skip the rest, so read the log's per-stage exit codes rather than assuming.
The digest already excludes anything present in the tracker, so its "Eligible"
list is the new work and its "Needs one question" list is the cheap owner
question. jobradar appends uncommitted rows to `tracker.csv` — commit before any
checkout in that repo.

## 4. X bookmarks and likes

The best-fitting lead of 2026-09-10 came from here, not from any board: a
recruiter's thread offering 220-300k USD total comp, remote and global, which no
job board carried. Worth the two minutes.

Open the real Chrome (never an isolated profile — see `browser-session-safety`),
raise the window, then read the rendered DOM:

```bash
open -na "Google Chrome" --args --profile-directory="Default" "https://x.com/i/bookmarks"
timeout 25 chrome-cli execute 'Array.from(document.querySelectorAll("article")).slice(0,12).map(a=>a.innerText.replace(/\n+/g," | ").slice(0,300)).join("\n=====\n")'
```

X renders empty on the first read after `open`: the tab exists, `innerText` is 0
characters. `chrome-cli reload` then a 10-second wait fixes it. Expand a
truncated post by clicking the "Mostrar más" span before reading it, or you lose
the half that carries the application address.

## Closing the round

- Every scored posting gets a tracker row, including the discards, with the
  one-line reason. A discard written down is never re-triaged.
- Status changes: `applied` becomes `screening` the moment an ATS asks for
  anything, with the deadline in `next_action`.
- Deliverables and durable learnings follow `job-search` and the compounding
  rule in the portfolio's `CLAUDE.md`; process learnings go to
  `career/hiring-playbook-2026.md`.
- Commit the tracker in the portfolio repo before the round ends.

## Self-healing and self-improvement

This file is expected to be wrong eventually — boards redesign, CLIs move,
selectors rot. When a step fails, fix it here in the same session: replace the
stale instruction rather than appending a second version beside it, and record
the dated observation that forced the change. When a round succeeds and
something would have saved time if written down, add it; delete any step that
has never once mattered.

Skills live in `~/p/agents`, never in the project repo:

```bash
git pull --ff-only origin main
pnpm run skills:compile
pnpm run check
git add src/skills/core/job-day/SKILL.md && git commit && git push origin main
pnpm run skills:link
```
