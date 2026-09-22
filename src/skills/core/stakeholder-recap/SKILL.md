---
name: stakeholder-recap
description:
  Produces a stakeholder status recap from the channel history, cross-checking
  every claim against commits and deploys before drafting. Trigger when the ask
  involves Discord or Slack messages, a status update for a stakeholder, or
  answering what happened in a channel. Triggers (ES) are resumen, recap, mira
  los mensajes, responder a, qué ha dicho. Do not use for invoice
  reconciliation, contract drafting, or reading channels without a recap or
  reply deliverable.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [channel-or-stakeholder]
---

## Rules

- Read the channel history before drafting anything. The last sent recap defines
  the baseline; never restate what stakeholders were already told.
- Every claim of progress must be cross-checked against evidence (commits,
  deploy state, closed tickets) before it goes into the recap. A claim with no
  artifact behind it is a plan, and must be phrased as one.
- Follow the instance's disclosure norms if it has a page for them. Absent one:
  outcome first, system health second, pointer to the ticket for depth, 3-5
  sentences; never inline the found-and-fixed list to a non-technical audience.
- Draft in the language and register the channel already uses.
- Never post without the user seeing the draft first, and never send credentials
  or internal details into an external channel.

## Workflow

1. Establish the audience and the channel. Read the recent history (at least
   back to the previous recap or the stakeholder's last question) and list what
   was already communicated.
2. Collect the ground truth since then. Commits, merges, deploys, closed items
   in the relevant repos; note dates so claims can be ordered.
3. Diff the two. What is new since the last recap, what was promised and is now
   done, what was promised and is not done (that goes in, honestly, with the
   next step), and what the stakeholder asked that is still unanswered.
4. Draft the recap per the communication norms and show it to the user for
   approval.
5. After the user approves and it is sent, record any commitments made in the
   recap into the project's backlog so the next recap can check them.

## Output

- Return: the draft recap, the evidence behind each claim (commit, deploy, or
  ticket), the open stakeholder questions it answers, and any new commitments
  recorded to the backlog.
