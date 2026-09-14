# Where the week lives

Identifiers verified 2026-09-04. Re-verify an id after a long gap: Slack DM ids
and Everhour task ids are stable, Jira assignments are not.

## People and Slack

| Who         | Slack user    | Channel       | Role this matters for               |
| ----------- | ------------- | ------------- | ----------------------------------- |
| Cristian    | `U06N3KRFJ5Q` |               | own messages: `from:<@U06N3KRFJ5Q>` |
| Phil Loyd   | `U03GDTKKNPK` | `D06N3KWQXNW` | ATC, Ask ATC pitch, standups, Kitco |
| James       | `U03FYBQHP0D` | `D06N0N9MA6R` | CBS ExecEd tickets and PR reviews   |
| Cole Pacak  | `U0684GQKD`   | `D06MX1562QN` | estimates, hours, ticket pauses     |
| #favish-dev |               | `C03GA7N9JF6` | infra decisions, security threads   |

Searches that worked, through the claude.ai Slack connector:

- own messages: filters `from:<@U06N3KRFJ5Q> after:YYYY-MM-DD`, sort
  `timestamp`, `include_context: false`; more than 20 results need a second
  page.
- a DM: `slack_read_channel` with the DM id and `oldest` as a Unix epoch **of
  the right year** (a 2025 epoch silently returns year-old messages).
- huddles: the DM history shows `Slackbot: A huddle started`, which gives the
  start time; the search keyword `huddle` finds nothing.

**Huddle durations exist, and they are billable time.** The connector does not
carry them, but Slack's own **Huddles** pane does: sidebar Huddles, section
"Recent huddles", one row per huddle with participant, relative day and exact
duration ("3 days ago · 49 minutes"). Read that pane rather than estimating — a
week with Phil ranges from under a minute to over an hour, so an estimate is
wrong by hours across a month. Two ways to get it, in order:

1. Drive the real Chrome (never a fresh profile) at `app.slack.com` and read the
   Huddles pane, per the browser-tools rule: `chrome-cli` for navigation, the
   Playwright extension server for the snapshot.
2. Ask Cristian for a screenshot of the pane; he has it open in seconds.

Map each row's relative day onto a date, then cross-check the start times
against the `A huddle started` lines in the DM. Measured 2026-09-04 with Phil:
Mon 31 Aug 6 min, Tue 1 Sep 49 min, Thu 3 Sep 12 min plus one under a minute;
the week before, Fri 28 Aug 1 h 01, Mon 24 Aug 31 min twice.

## Jira (favish.atlassian.net, cloudId `de54f569-7c48-4be0-9f7c-37f053d93a18`)

- Week's issues:
  `(assignee = currentUser() OR reporter = currentUser() OR worklogAuthor = currentUser()) AND updated >= "<monday>" ORDER BY updated DESC`.
  Pass explicit `fields`; the default set with descriptions is 180 kB.
- Comments on a ticket: `getJiraIssue` with `fields: ["comment"]` and
  `responseContentFormat: markdown`.
- Projects: `CEERP2` (CBS platform), `CBSMARK26` (CBS marketing SEO), `FAV`
  (internal; `FAV-272` is the Standup task, `FAV-950` the Ask ATC prototype),
  `KM` and `KTM` (Kitco), `WA` (Wealth Advisor), `ATCM` and `ATCUI` (ATC), `ZH`.
- New CEERP2 issues auto-assign to Cole; a ticket assigned to him can still be
  Cristian's work, which is why the JQL includes `reporter = currentUser()`.

## Gmail (cristian@favish.com)

- Meeting notes: `from:gemini-notes@google.com` (Google Meet: standups,
  All-Hands, project syncs) and `from:no-reply@fathom.video` (Phil's Fathom
  recaps, sent about an hour after the call). Both list per-person action items;
  those are the commitments to check the following week.
- Jira digests: `from:jira@favish.atlassian.net`; the Thursday "weekly update"
  mail lists every mention.
- Everhour: `from:noreply@everhour.com` monthly summary on the 1st.
- Calendar: `list_events` Monday to Sunday. Standup 16:30 CEST daily (Phil),
  Weekly Favish All-Hands Monday 18:00 CEST, linked to `FAV-272`.

## Code: local commits

Do not start from a list of Favish repos; start from every repo that moved and
classify it by its remote owner. `favish`, `InteliFactu`, `BusiRocket`,
`CristianDeluxe`, `pixel-potion`, `VexaMail` and `DJ-Rocket` are different
employers or none, and only `favish` (plus `pixel-potion` for Phil's Pixel
Potion work, which bills elsewhere) is Everhour time.

```bash
for r in ~/p/*/; do
  [ -d "$r/.git" ] || continue
  n=$(git -C "$r" log --all --author=Cristian --since=<monday> --oneline 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" = 0 ] && continue
  org=$(git -C "$r" remote get-url origin 2>/dev/null | sed -E 's#.*[:/]([^/]+)/[^/]+$#\1#')
  printf '%-4s %-14s %s\n' "$n" "$org" "$(basename "$r")"
done | sort -rn
```

Then, per Favish repo: `git fetch --all --prune`,
`git log --all --author=Cristian --since=<monday> --format='%ad %h %s' --date=short`,
and the local-only check, which is the one that finds work nobody else can see:

```bash
up=$(git -C "$r" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
git -C "$r" rev-list --count ${up:+@{u}..HEAD} ${up:-HEAD --not --remotes}
```

A branch with commits and no remote is finished work that is invisible to the
team; it belongs in the report as "done, not pushed", never as "delivered".
Measured 2026-09-04: `cbs-execed` carried four CEERP2-1286 commits locally while
GitHub showed no cbs-execed activity at all that week.

## Code: GitHub

- Own activity, private repos included, through the `CristianDeluxe` token:
  `gh api "users/CristianDeluxe/events?per_page=100" --jq '.[] | select(.created_at >= "<monday>") | "\(.created_at[0:16]) \(.type) \(.repo.name)"'`.
  Push events carry no usable commit payload here (`payload.commits` is null),
  so use them to say **which repo and when**, and take the content from the
  local git log.
- Pull requests:
  `gh search prs --owner favish --author CristianDeluxe --limit 20` for what was
  opened, and `--involves CristianDeluxe --updated ">=<monday>"` for reviews and
  mentions on other people's PRs.
- On one PR: `gh pr view <n> --json comments,reviews,reviewDecision,mergeable`;
  inline review threads need the GraphQL query, since a reviewer's design
  proposal often lands as one long inline comment rather than a review body.

```bash
gh api graphql -f query='query{repository(owner:"favish",name:"<repo>"){pullRequest(number:<n>){reviewThreads(first:30){nodes{isResolved path line comments(first:5){nodes{author{login} createdAt body}}}}}}}'
```

- Compare the two sides. GitHub activity without local commits means someone
  else moved the branch; local commits without GitHub activity means unpushed
  work, which is the case that changes what to say on Monday.

## Brain and memory

- `~/p/wiki/brain/projects/cbs-execed.md`, `atc-portal.md`, `kitco.md`,
  `favish-gateway.md`; `business/communication-norms.md` for the report shape.
- Project memories under
  `~/.claude-favish/projects/-Users-cristiandeluxe-p-<repo>/memory/` (and the
  `~/.claude` twin for the personal profile): ticket design notes, estimate
  history, the Everhour method.
- `atrium_recall` with the repo path lists the episodes already synthesized for
  that project.

## Claude session activity (evidence of hours, not hours)

Parses every transcript timestamp in both profiles, collapses gaps over 15
minutes, and prints active hours per project and day. It undercounts by roughly
a third: browser testing, Orca terminals and codex runs leave no transcript. Set
`start` to the Monday of the week.

```python
import glob, os, datetime, collections
from zoneinfo import ZoneInfo

tz = ZoneInfo("Europe/Madrid")
start = datetime.datetime(2026, 8, 31, tzinfo=tz)
end = start + datetime.timedelta(days=7)
roots = glob.glob(os.path.expanduser("~/.claude/projects/*")) + glob.glob(
    os.path.expanduser("~/.claude-favish/projects/*")
)
per = collections.defaultdict(list)
for r in roots:
    for f in glob.glob(r + "/*.jsonl"):
        if datetime.datetime.fromtimestamp(os.path.getmtime(f), tz) < start:
            continue
        for line in open(f, errors="ignore"):
            i = line.find('"timestamp":"')
            if i < 0:
                continue
            try:
                t = datetime.datetime.fromisoformat(
                    line[i + 13 : i + 37].replace("Z", "+00:00")
                ).astimezone(tz)
            except ValueError:
                continue
            if start <= t < end:
                per[os.path.basename(r)].append(t)
res = collections.defaultdict(lambda: collections.defaultdict(float))
for p, ts in per.items():
    ts.sort()
    s = last = ts[0]
    for t in ts[1:]:
        if (t - last).total_seconds() > 900:
            res[p][s.strftime("%a %d")] += (last - s).total_seconds() / 3600
            s = t
        last = t
    res[p][s.strftime("%a %d")] += (last - s).total_seconds() / 3600
for p in sorted(res, key=lambda p: -sum(res[p].values())):
    days = ", ".join(f"{d}:{h:.1f}" for d, h in sorted(res[p].items()))
    print(f"{sum(res[p].values()):5.1f}h {p:55s} {days}")
```
