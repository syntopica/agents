# Browser to HTTP Migration

Use when an existing browser automation should become a direct HTTP client, or
when a browser session is the only available way to capture the protocol.

## Why migrate

Browser control costs a full round trip per interaction, and each page snapshot,
screenshot, or accessibility dump is injected into the agent context. A derived
client replaces that with one request and a parsed response. The saving is
largest on repetitive flows: pagination, bulk downloads, polling, and any
workflow re-run across sessions.

Migrate when the flow is repeated, the endpoints are stable, and the response
carries the data. Do not migrate a one-off exploration, or a flow where the
browser is the subject under test.

## The screenshot loop is the smell

The common failure is not choosing the browser once. It is staying in a
screenshot, look, click, screenshot loop for the whole task, so nothing durable
survives the session and the next run repeats the same logins from zero.

Stop and derive a client when any of these hold:

- the same portal login has been driven more than once, in this session or a
  previous one
- the loop is fetching data rather than verifying a rendered UI
- screenshots are being taken to read text that the page received as JSON
- the task is per-period or per-account and will obviously recur
- scripted extraction is already being run inside the page, which means the
  shape is understood

The distinction that matters is target, not tooling: a local development server
being checked visually should stay in the browser, while a third-party portal
being harvested for records should not. Reach for `get_page_text` or `find` over
a screenshot when the goal is text, and reach for the network tools below before
either.

## Capturing the protocol from an agent browser session

Prefer the network inspection tools over page reading, and prefer a filter over
a full dump.

- Chrome extension: `read_network_requests`
- Chrome DevTools MCP: `chrome-devtools:list_network_requests`, then
  `chrome-devtools:get_network_request` for the few that matter
- Playwright MCP: `browser_network_requests`

Procedure:

1. Navigate and reach the state just before the target action.
2. Clear or note the request boundary, then perform the single action to
   isolate.
3. List requests, filter to the target host and XHR/fetch resource types.
4. Fetch full detail only for the handful of candidate endpoints.
5. Read the auth material once, record where it lives, and redact it from any
   written output.

HAR exports lack response bodies in many tools; when the body matters, pull it
through the CDP request detail rather than assuming the shape.

## Migration sequence

1. Keep the existing browser path working as the reference implementation.
2. Capture one complete successful workflow.
3. Implement the direct client alongside it.
4. Compare outputs on the same input.
5. Switch reads first; leave writes on the browser path until reads are proven.
6. Retain browser login or session acquisition if the credential cannot be
   obtained otherwise.
7. Remove browser steps only after repeated validation across fresh sessions.

A hybrid solution beats a fragile pure-HTTP one when the site computes opaque
values in JavaScript: drive the page only to mint the value, then run the rest
of the workflow over plain HTTP.

## Failure-mode diagnosis

When a direct replay fails, locate the actual dependency instead of copying more
headers.

| Symptom                             | Likely cause                                            |
| ----------------------------------- | ------------------------------------------------------- |
| 401/403 immediately                 | expired session, missing bootstrap request, wrong scope |
| works in browser, fails from client | Origin/Referer validation, or cookie SameSite behavior  |
| 403 with valid cookies              | missing CSRF token paired with the cookie               |
| works once, then fails              | single-use nonce, or token rotation on each response    |
| fails only from a new process       | state held in local storage or a service worker         |
| challenge page or JS-only response  | bot mitigation, device binding, TLS fingerprinting      |
| inconsistent by client library      | HTTP/2 behavior or header-order sensitivity             |
| empty or truncated body             | compression or binary serialization not handled         |
| pagination stops early              | hidden cursor state carried outside the visible params  |

Bisect by removing suspected headers one at a time, and by replaying from a
clean process with only the recorded credential.

## Documenting fragility

Every derived client against a private endpoint is a maintenance liability.
State in the README:

- which endpoints are undocumented and may change without notice
- which values expire, and the observable symptom when they do
- the exact recapture procedure, including which page action produces the
  request
- known rate limits and concurrency ceilings
- the conditions under which the browser fallback is still required
