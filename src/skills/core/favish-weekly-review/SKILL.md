---
name: favish-weekly-review
description:
  Builds the Friday status of every Favish task from Jira, Slack, Gmail meeting
  notes, git branches, Everhour and the brain. Trigger when the ask is what to
  report at Monday's standup or all-hands, what was done this week, who each
  ticket is waiting on, what else fits before the day ends, or logging the
  week's hours in Everhour. Triggers (ES) are estado de todo, qué digo el lunes,
  qué hice esta semana, justificar las horas, loguear en everhour. Do not use
  for a client-facing recap of one channel (stakeholder-recap), for working a
  single ticket (jira-ticket-flow), or for personal projects, which never enter
  Everhour.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
argument-hint: [week-start-date]
---

## Rules

- Favish only: the `cristian@favish.com` identity, the Favish Slack, Jira
  `favish.atlassian.net`, Everhour. Personal repos and sessions are evidence of
  time spent, never of Favish hours. Read `references/sources.md` first; it
  holds the channel ids, JQL, Gmail queries and the evidence script.
- Every "done" claim points at an artifact: a commit, a PR, a Jira comment, a
  Slack message or a meeting note. Anything without one is reported as a plan.
- Hours are a billing record. Log only time backed by evidence from at least one
  source, treat the contract shape (about 6 h/day, 5 days) as the ceiling rather
  than the target, and never book a personal-project session to a Favish task.
- Cole reviews per-ticket totals against his estimates. Before logging, note
  which tickets are sensitive this week (an estimate he called high, a ticket he
  paused) and put that note in the report, not in Everhour.
- Standing authorization: reading every source, and writing time entries to
  Everhour. Not authorized without an explicit ask: posting to Slack or Jira,
  pushing branches, opening PRs.

## Workflow

1. Baseline. Read the brain project pages for each active Favish client
   (`~/p/wiki/brain/projects/`), the project memories, and last week's Everhour
   entries. Note what was already reported at the previous all-hands (Gemini
   notes email) so Monday does not repeat it.
2. Collect this week, Monday to today, from every source in
   `references/sources.md`: Jira issues touched and comments addressed to
   Cristian, GitHub events and pull-request review threads, Slack DMs with Phil,
   James and Cole plus the team channels, huddles with their real durations,
   meeting notes (Gemini, Fathom) and calendar events, commits and local-only
   branches across every repo whose remote belongs to Favish, and Claude session
   activity per day.
3. Per task, write four lines: what was done (with the artifact), where it is
   now, who it waits on and since when, and the next action with its owner.
4. Reconcile hours per `references/everhour-logging.md`: evidence per day versus
   Everhour, propose entries per day and task, log them, and verify the totals
   by re-reading the week from the API.
5. Report: the Monday script (three to five sentences per project, outcome
   first), the waiting-on list, what still fits today ranked by value and by the
   hours it justifies, and the Everhour table. Then update the brain project
   pages with a dated status block, and the project memory with any new ids,
   task mappings or quirks found.

## Output

- Return: the Monday script, the per-task table (done, state, waiting on, next),
  the today list, the Everhour entries written with their ids and the verified
  per-day totals, and the brain and memory files updated.
