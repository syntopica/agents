---
name: brp-traffic-client
description:
  Turns observed application traffic into the smallest reliable programmatic
  client, replacing browser automation with direct HTTP calls. Trigger when the
  task involves HAR files, DevTools or CDP network exports, cURL or "Copy as
  fetch" output, proxy captures, or an existing
  Playwright/Puppeteer/browser-agent flow that is slow, brittle, or
  token-expensive. Do not use for documented public APIs with an official SDK,
  for UI testing where the browser is the subject under test, or for bypassing
  access controls.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, TodoWrite
effort: high
argument-hint: [capture-path-or-target-operation]
---

## Rules

- Treat captured traffic as evidence, not as a specification.
- Derive the protocol before generating code; a single successful replay proves
  nothing.
- A response that parses is not a correct response. Server-side view state,
  cached grids, and echoed result blocks all return HTTP 200 with the wrong
  data.
- Absence of a record in one endpoint is not proof it does not exist. Establish
  what the source covers before reporting anything as missing.
- Start from the minimum header set and add only headers proven necessary. Never
  bulk-copy DevTools headers to make a failing replay pass.
- Keep browser or CDP steps only where page execution is genuinely required:
  interactive login, dynamic signing, device attestation, anti-bot challenges.
- Match the host project's language, package manager, and HTTP primitives.
  Standalone utilities pick the simplest efficient runtime, not a default one.
- Never commit live credentials, and redact secrets in logs, fixtures, and
  documentation.
- Do not bypass access controls, escalate privileges, or reach data the user is
  not authorized for.

## Workflow

1. Name the exact user-visible operation to reproduce and separate it from
   incidental page traffic.
2. Inspect the target project to choose the stack, or justify the runtime for a
   standalone tool.
3. Build an endpoint inventory from the capture: method, URL pattern, auth,
   payload, pagination, side effects.
4. Infer the protocol: stable versus dynamic values, token lifetime, cursor
   semantics, signing.
5. Pick an authentication strategy, preferring documented auth over scraped
   session material.
6. Implement one read-only vertical slice and validate it against a known
   browser result.
7. Probe the parameter space before looping over it: which filters are
   mandatory, which widen the result set when omitted, and which pairs the
   server itself declares valid.
8. Add resilience only where the capture shows it is needed: refresh,
   pagination, retry, rate limit.
9. Test beyond replay: fresh session, expired token, pagination boundaries,
   header reduction, and two different queries back to back on one session.
10. Establish the source's coverage, and cross-check any absence against a
    second source before acting on it.
11. Deliver the client plus an endpoint map, `.env.example`, and a recapture
    procedure.

## Output

- Return: target operation, endpoint map, stack choice and why, working client,
  what was verified versus inferred, and which values expire.

## References

- `references/traffic-analysis-checklist.md` — capture triage, endpoint
  inventory, header reduction, auth and dynamic-value tracing, validation
  matrix.
- `references/browser-to-http-migration.md` — replacing an existing browser
  automation, hybrid CDP bridges, and failure-mode diagnosis when direct replay
  breaks.
- `references/stateful-and-bulk-clients.md` — server-side view state, mandatory
  versus widening filters, source coverage limits, and making a long bulk sweep
  cheap and restartable.
