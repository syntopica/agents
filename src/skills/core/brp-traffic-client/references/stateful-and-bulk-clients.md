# Stateful Servers and Bulk Sweeps

Use when the target keeps per-session state on the server (JSF, ZK, ASP.NET
WebForms, Struts, classic portal apps) or when the client has to enumerate a
large parameter space rather than fetch one document.

## Server-side view state

Component frameworks keep the rendered page on the server and address it by a
desktop, view, or session id. The client posts component events, not resources.
Consequences:

- The page id is often escaped in the HTML (`dt:'z_1hIcQx\x2DaFqdpE7q9bkQN4A'`).
  A `\w+` capture silently truncates it. Match to the closing quote, then
  unescape.
- A reused view **replays the previous query's rendered result**. Search B right
  after search A can return A's rows with HTTP 200 and a perfectly parseable
  body. This is the most dangerous failure in this class because nothing errors.
- Widget ids are per-render. Re-read them after every reload rather than caching
  them.
- Responses frequently echo the same block twice (once as a component update,
  once as content). Dedupe by a stable business key, not by position, and never
  split on a marker that only appears in some responses.

Detection: run two queries whose results must differ (different modelo,
different year, different customer) on one session and assert the outputs differ
and each matches an independent fetch. Do this before any bulk run, and keep it
as a regression test.

Mitigation, in order of preference: re-fetch the entry page per query (correct,
costly); reset the view through whatever "new search" affordance the app
exposes; only then consider reusing state. Verify the chosen mitigation with the
two-query test rather than assuming it works.

## Mandatory versus widening filters

Before enumerating a parameter grid, test each filter on its own:

- **Mandatory**: omitting it returns an error page, not "everything". Discover
  this early or the whole enumeration strategy is wrong.
- **Widening**: omitting it returns _every_ value of that dimension in one
  response. Finding one of these collapses a dimension of the grid — often a 4x
  or 12x reduction.
- **Server-declared valid pairs**: dependent dropdowns are repopulated from the
  server. That list is the application's own answer to which combinations are
  queryable, and is usually far smaller than the cartesian product.

## Application metadata versus per-subject data

Ask whether a discovery step depends on _who_ is authenticated.
Dependent-dropdown contents, catalogs, and code lists are usually application
metadata: identical for every user. Verify by running the same discovery with
two credentials and diffing.

When it is metadata, discover once and cache it to disk, keyed by nothing but
the app version. A sweep across N subjects then pays discovery once instead of N
times. Make the cache file explicit and deletable so it can be rebuilt when the
app changes.

## Long bulk runs

- **Retry transient failures.** Long sessions against public-sector and legacy
  hosts drop connections (curl exit 52/56, truncated bodies). Retry with backoff
  at the transport call, not around the whole run.
- **Never let a late failure void an early success.** Write results
  incrementally, or checkpoint, so an hour of work does not disappear on request
  900 of 1000.
- **Parallelise across subjects, not within a session.** One session is a state
  machine; concurrent requests inside it corrupt view state. Several independent
  sessions are usually fine, but expect throttling and back off — the failure
  looks like a network error, not a 429.
- **Skip empty regions cheaply.** Print or log a per-region summary so a silent
  zero is visible as a zero and not mistaken for coverage.

## Source coverage

An endpoint usually serves one class of records, and its scope is rarely stated.
A query that returns nothing may mean "not filed", "not in this application", or
"outside the retention window".

- Establish the boundaries explicitly: which record types, which date range,
  which states.
- Find the sibling application for the classes the first one excludes.
- Before reporting anything as missing, cross-check the absence against an
  independent source that aggregates the same facts (an annual summary against
  its periodic filings, a statement against its line items).
- Encode the boundary in the output. A field that says "this source cannot know"
  is worth more than a gap the caller will read as a fact.

## Artifacts that look alike

When downloading documents, verify you fetched the artifact you meant. Drafts,
forms, previews and official receipts often share a layout and differ only in a
header block or an id series. Assert on content (an expected marker, an id
format), not on HTTP 200 and a PDF magic number.
