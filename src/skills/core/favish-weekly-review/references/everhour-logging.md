# Everhour: reconcile and log the week

API key: `~/p/wiki/brain/business/apis.md`, section Everhour. Base
`https://api.everhour.com`, header `X-Api-Key`. Copy the key into a mode-600
file in the scratchpad and read it from there; never echo it.

## Read

- Entries: `GET /users/me/time?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=1000`. Each
  entry carries `date`, `time` (seconds), `task.number` (Jira key), `task.name`,
  `comment`, `isLocked`. Read with Python `urllib`; a shell loop of `curl` calls
  returned empty bodies intermittently on 2026-09-04.
- Task id for a Jira key: `GET /tasks/search?query=<KEY>&limit=5`, keep the hit
  whose `number` equals the key. Ids look like `jr:8062-<jira issue id>`.
- `GET /projects/<id>/tasks` returns 400 with this key; search by key instead.

## Write

- `POST /time` with `{date, time, task, comment}`; `task` is optional
  (comment-only entry). The same day and task **aggregate** into one record, so
  the id returned is the day-task record and a second comment is appended.
- `PUT /time/{id}` with `{time, date, comment}` edits; check `isLocked` first.
  `DELETE /time/{id}` answers 200 but leaves a 0 h row; harmless.
- Task creation is refused (403: member role, Jira-synced projects). A Jira
  ticket without an Everhour task (sync lag, seen for `CEERP2-1286` three days
  after creation) is logged on its parent Epic with the key at the start of the
  comment, so it can be moved later.

## Task ids that recur

| Jira key     | Everhour task | Use for                                   |
| ------------ | ------------- | ----------------------------------------- |
| FAV-272      | jr:8062-42317 | Standup and the Monday All-Hands          |
| FAV-950      | jr:8062-75822 | Ask ATC prototype, pitch deck, Phil syncs |
| CEERP2-1282  | jr:8062-75779 | ExecEd and Alumni Edge consolidation      |
| CEERP2-1283  | jr:8062-75826 | Security epic; children without a task    |
| CEERP2-1284  | jr:8062-75827 | Platform epic                             |
| CBSMARK26-21 | jr:8062-63822 | Translation URL (Cole watches its total)  |
| CBSMARK26-53 | jr:8062-75828 | International SEO epic                    |

## Reconcile

1. Build the evidence per day: Claude sessions (the script in `sources.md`),
   commits classified by remote owner, GitHub events, Slack messages, huddles
   with the durations read from the Huddles pane, calendar and meeting notes. A
   night session belongs to the day it started. Meetings are logged at their
   real length: the Google Meet invite length for calls, the huddle pane
   duration for huddles, both rounded to the nearest quarter hour.
2. Subtract what is already in Everhour for the week.
3. Propose one entry per day and task with a comment that names the artifact
   (the PR, the Jira comment, the meeting). Keep the comment under 90
   characters; it shows in Cole's report.
4. Apply, then re-read the week and print per-day and per-task totals. Report
   those totals, never the intended ones.

Reference weeks: 2026-08-24 logged 23 h (CEERP2-1282 10, CBSMARK26-21 7, WA-522
3, KM-295 2, standup 1); 2026-08-31 logged 27.8 h Monday to Thursday
(CEERP2-1283 including the 1286 work 12, FAV-950 11.25, standups 2.5,
CEERP2-1282 2).
