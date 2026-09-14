# TODO — rocket-agents

> Consolidated from the accessible Claude, Codex, Cursor, and Antigravity
> project history plus the `~/p` meta backlog (routed 2026-08-13) and the
> archived `BusiRocket/agents-skills` backlog. Last reviewed: 2026-08-24, when
> the library's own content decisions moved to
> `~/p/rocket-agents-library/TODO.md` and every remaining item was given an
> explicit disposition. History coverage: Partial — Claude Code transcripts
> before 2026-07-19 no longer exist on disk (repo work starts 2026-02-27), and
> the 2026-07-19 audit scratchpad reports (`findings.md`, `findings30.md`) were
> reconstructed from Codex rollouts, not read from disk. Open items from
> `TODO-skills-audit.md` (append-only audit history) are tracked here; that file
> is no longer a backlog.
>
> States: `[ ]` pending · `[~]` partial or unverified · `[!]` blocked · `[x]`
> verified complete · `[-]` obsolete or superseded. Closed work moves to
> `TODO_LOG.md`.

## Skills library cleanup

> Decided 2026-08-17: curate one list and link it to every IDE including
> Antigravity, rather than the current split where Claude Code is offered 13
> skills and the other 94 bundles reach only Codex. Nothing is deleted; unused
> bundles leave the default fan-out and stay in the repo. Measurements:
> `~/p/dotfiles/docs/machine-inventory/skills-triage.md`.
>
> The content decisions moved to `~/p/rocket-agents-library/TODO.md` on
> 2026-08-24 - deleting the Java/Spring bundles, the skill-by-skill triage, the
> 87 parked entries, the multi-surface capabilities, the two dropped
> classifications, the re-check window, and the five measured-but- unbuilt skill
> gaps. They are decisions about that repository's contents, and executing them
> here would edit another repo. What stays below is the part this engine owns.

Nothing open: the curated list reaches Claude and Antigravity, and the remaining
content decisions live in `~/p/rocket-agents-library/TODO.md`.

## Skill library and learning loop

- [ ] **`job-application` skill names none of the seven career gates.** The
      skill is the source of truth for submitting an application, and on
      2026-09-10 it referenced neither `pnpm career:check`,
      `check-attachment.mjs`, `build-audit-brief.mjs` /
      `write-audit-verdict.mjs`, nor `render-resumes.mjs` - every one of which
      exists in `~/p/cristian-deluxe-developer-portfolio/scripts/career/` and
      gates a real failure that already happened once. Evidence:
      `grep -n "career:check\|check-attachment" \     src/skills/core/job-application/SKILL.md`
      returns nothing. Smallest next step: add the gate sequence written up in
      that repo's `career/application-procedure.md` to Phase 5 and Phase 6 of
      the skill.

> Shipped 2026-08-18: the four curation states, seeding from the lock, per-skill
> curation, linking what is adopted, the transcript observer, trigger learning
> with secret redaction, delegated classification, the router audit, proposals
> and automatic parking behind a grace period. Claude Code went from 13 skills
> offered to 30. Spec and plan:
> `docs/superpowers/specs/2026-08-18-skill-library-and-learning-loop-design.md`.

- [!] Exercise patch reapplication against a real fork. Implemented and tested
  for the conflict case, never run for real. Blocked on its own precondition:
  nothing in the library is forked yet, so there is no upstream change to
  reapply a local patch onto. Unblock action: the first time a library skill is
  forked and its upstream moves, run the reapplication then.

## Machine provisioning

> Scope decided 2026-08-17: this repo stays public and data-free and holds the
> engine (schemas, capture readers, per-target renderers, CLI). The manifests
> carrying real values stay in the private `BusiRocket/dotfiles` repo, which
> already owns brew, shell, symlinks, launchd and secrets. Measured inventories
> behind these items: `~/p/dotfiles/docs/machine-inventory/`.

- [ ] Decide whether a global rule should carry "never rsync a live database,
      and never rsync anything that has its own sync protocol". On 2026-09-10 a
      bidirectional `rsync -au` of `~/.local/share/atuin` between the two Macs
      truncated both of the Mac mini's SQLite databases into
      `database disk image is malformed`, and carried `meta.db` with them, which
      cloned the machine identity so both Macs claimed one `host_id` in an
      append-only record store. A SQLite database is not one file, `-au` is
      whole-file newest-wins, and a daemon holds it open continuously, so there
      is no safe moment. The specific entries are already gone from
      `dotfiles/home-sync.list`; this item is only about whether the general
      trap earns a line in the always-loaded rules or stays as
      `~/p/brain/topics/atuin-shell-history` and
      `~/p/brain/topics/machine-sync`. Smallest next step: the owner says rule
      or wiki-only.
- [!] Complete account-local authentication on `macmini`. Managed configuration
  is converged, but `agents:doctor` still reports Cursor MCP failed; Claude
  needs Cloudflare in personal and Favish plus OpenSEO in personal. ZeroHedge is
  optional and absent in both Claude profiles. Authentication requires the
  user's browser/account session and must not be copied from another machine.
  User decision 2026-08-22: will log in on the mini on demand, when those
  services are next needed there — not a scheduled task. Follow
  `docs/runbooks/claude-connector-authentication.md`, then verify with
  `pnpm run connectors:doctor -- --json` and `pnpm run agents:doctor -- --json`
  on the mini.
- [ ] Decide whether `context7` should reach gemini and cursor. Now executable
      in isolation: `machine:apply -- --domain mcp`. It is the only real gap
      `machine:diff` reports after the 2026-08-31 manifest repair: the manifest
      declares it for codex, gemini and cursor, and only codex has it. Applying
      writes into two other tools' configuration and needs `CONTEXT7_API_KEY`,
      so it waits for a yes. Everything else - plugins, security, capabilities,
      services - is converged.
- [~] Install provenance: the archive half is done (2026-08-24, see
  `TODO_LOG.md` — `agy` 1.1.19 and `herdr` 0.8.0 copied to
  `~/p/_archivar/handmade-binaries/` with SHA-256 sums; `npm ls -g` and
  `uv tool list` re-confirmed codegraph and serena-agent live in package
  managers). Remaining: extend the dotfiles runtime-inventory sweep method to
  read the two package managers (filed in `~/p/dotfiles/TODO.md`), and note that
  `agy` self-updates (1.1.17 -> 1.1.19 in two days), so the archive is a
  disaster copy, not a pin.
- [!] `config` apply must merge, never replace: third-party tools (orca, atuin,
  warp) inject hooks into `settings.json` without asking, and a full rewrite
  drops them. Verified 2026-08-22 that this is a constraint on unbuilt code, not
  a live defect: there is no `config` domain, and the one settings writer that
  exists (`domains/security/writeClaudeSettings.ts`) already spreads the
  existing document. Carry the constraint into the domain when it is built.
  **Blocked on:** the `config` domain, which does not exist yet (re-verified
  2026-09-09: `grep -rl "config" scripts/lib/machine/domains` names no such
  domain). Smallest unblock: build the domain; carry this rule into its writer
  on day one.

## Supply chain and secrets

- [!] Rotate the still-live credentials recovered on 2026-08-17 from
  `~/.gemini/mcp_config.json` (2 GitHub PATs, Context7, Bright Data, Firecrawl,
  Browser Use, n8n JWT, Brave Search; the two ZeroHedge MongoDB URIs only need
  revoking). Values and uses in `~/p/brain/business/misc-credentials.md`. State
  2026-08-22: user explicitly deferred the rotation ("de momento no voy a rotar
  ninguna"); neo cleanup done (no `mcp_config.json` in `/root/.gemini`, and
  `p/brain`/`p/vault` copies deleted); remaining exposure surface is
  `portatil`'s legacy `~/.gemini` (machine unreachable 2026-08-22 — delete it
  when the laptop is next on the network) plus the providers themselves. Unblock
  action when resumed: the per-provider dashboard checklist from the 2026-08-22
  session.
- [ ] Turn on GitHub secret scanning and push protection, then close the hook
      gap. Surveyed 2026-08-31: of 134 repositories under `~/p`, 18 carry a
      secret hook (all lefthook + gitleaks, this repo among them) and 116 carry
      none. But the per-repo hook is the weaker lever - it only guards the
      machine it is installed on. GitHub's own scanning is free on public
      repositories and can be defaulted for a whole organisation, and it is
      **disabled**: verified against `BusiRocket/rocket-agents`, which returns
      `secret_scanning: disabled, push_protection: disabled`. Private
      repositories return `null` for both, so they need Advanced Security and
      stay on hooks. The user-owned public surface is 14 repositories under
      BusiRocket and 18 under CristianDeluxe; Favish and client organisations
      are not ours to change. Smallest step, and it needs a yes because it
      writes GitHub settings: enable the organisation default for those two,
      then add gitleaks to the private repositories that are actually active.
      Source: `~/p/brain/topics/app-security.md`.
- [ ] Adopt pnpm 11 supply-chain controls across the other `~/p` repos:
      `minimumReleaseAge: 1440` (a 24h cooldown defeats the compromised-token
      window) and `blockExoticSubdeps: true`. Surveyed 2026-08-31: of 135
      repositories, 44 use pnpm and only 9 declare `minimumReleaseAge` - this
      repository among them. The other 35 are listed by the survey command
      below; several are dormant, so the useful cut is the ones still being
      installed. Executing it here would edit other repositories, so it stays a
      per-repo action taken when each is next touched. Command:
      `for d in ~/p/*/; do ... grep minimumReleaseAge ...` (see `TODO_LOG.md`
      2026-08-31 for the exact sweep). Source:
      `~/p/brain/topics/supply-chain-security.md`.
- [!] Add `uv export --format requirements.txt` to any CI that adopts `uv`, as
  the exit ramp now that OpenAI owns it — one line, converts lock-in into a
  preference. Blocked by its own precondition: a 2026-08-22 sweep of
  `~/p/*/.github/workflows` found no workflow using `uv`. Unblock action: apply
  it in the first workflow that adopts `uv`. Source:
  `~/p/brain/topics/supply-chain-security.md`.

## Harness

- [x] `pnpm run check` was red on `REBUILD_DERIVED_DATABASE_TEST.ts` (entries 1,
      expected 3). Root cause, 2026-09-12: `runSqliteIntegrityCheck` spawned
      `sqlite3 <db> 'PRAGMA integrity_check;'`, and Homebrew sqlite3 3.53.4,
      first on PATH via `.zprofile`, deletes the stale `-wal` and `-shm` of a
      file that is not a database; Apple's 3.51 in `/usr/bin` does not, which is
      why the test was green until the machine's PATH changed. Fixed by passing
      `-readonly`, which both binaries honour and which still reports the
      corruption. Verified: codex-state suite 28/28, `pnpm run check` exit 0.
- [ ] Dependency sweep for native replacements across the `~/p` frontends:
      `Intl.*` for formatting, `crypto.randomUUID`, `structuredClone`,
      `URLSearchParams`, `AbortController`. Measured elsewhere: audit
      vulnerabilities 17 -> 5. Fewer deps also shrinks the supply-chain surface.
      Out of this repository's scope to execute - it changes other projects'
      dependencies - so the smallest real step is to run it in one frontend when
      that project is next open, and file the result there. Tracked here by the
      2026-08-13 routing decision. Source: `~/p/brain/topics/web-platform.md`.

### Four harness experiments routed from `~/p/TODO.md`, 2026-09-08

Each is a change to how a session is prompted, budgeted or measured, which is
this repository's subject; the meta backlog only held them because they arrived
from brain reading. Moved verbatim with their sources.

- [ ] Audit tool/prompt churn for cache economics: cache hits cost 10% of input
      price but need an exact stable prefix, so mid-session tool changes or
      naive compaction silently destroy it. `/cost` cache-hit % is the
      diagnostic. Source: `~/p/brain/topics/claude-code-practice.md`.
- [ ] Try prompt contracts (Goal / Constraints / Output Format / Failure
      Conditions) plus a session-opening CLAUDE.md handshake on one real task;
      failure conditions turn vague quality bars into rejection tests. Source:
      `~/p/brain/topics/claude-code-practice.md`.
- [ ] Watch the Advisor Tool (`advisor-tool-2026-03-01`) out of beta: a Sonnet
      or Haiku executor consulting Opus in a single request is the supported
      form of the codex/agy offload used here, and the published numbers are
      cheaper and better on two benchmarks. Source:
      `~/p/brain/topics/claude-code-practice.md`.
- [ ] Try RTK (Rust command-output filter, 63k stars) on one real session and
      measure with `/caveman-stats` alongside; the interventions may overlap.
      Source: `~/p/brain/topics/agent-token-economy.md`.

### Serena's scoped keep, and the read-to-edit measurement, routed from `~/p/TODO.md`, 2026-09-09

Both measure how a session navigates and edits code, and the rule that gives
serena its two jobs lives here (`src/rules/global/code-navigation.md`); the meta
backlog only held them because the numbers were read from `~/.claude/projects`.
Moved verbatim.

- [~] Serena: **keep it, scoped** — decided 2026-09-01 after two rounds of
  head-to-head testing against codegraph. The 2026-08-08 trial found 0 real tool
  calls since 2026-07-24. Re-measured 2026-09-01 across the **entire transcript
  store, 4,782 conversations**: **0 calls ever**, of any of its tools — and
  `.serena/` project dirs exist in **95 repos**, so the setup cost was already
  paid everywhere and it still never won a call. **Live comparison run
  2026-09-01** on `intelifactu`, on serena's best case — "who references
  `ShortcutHint`", a component created that day and not committed, i.e. exactly
  the working-tree slot the global CLAUDE.md reserves for a language server.
  Ground truth by grep: **3 files** reference it (`PurchaseDocumentPager.tsx`,
  `PurchaseDocumentToolbar.tsx`, and `ShortcutHint.test.tsx`).
  - serena: 4 round-trips (`initial_instructions` ~1.4k tokens, then
    `activate_project`, `find_symbol`, `find_referencing_symbols`). Answer was
    compact and well-shaped (~600 tokens) — but it returned **only 2 of the 3
    files. It silently missed every reference in the test file**, with no
    warning that its view was partial.
  - codegraph: **1 call**. Found all three, named `ShortcutHint.test.tsx`
    explicitly as the test covering it, plus the blast radius, the
    dynamic-dispatch edges and the verbatim source of 8 files. Cost ~5k tokens
    and a 3-call-per-project budget, so it is the more verbose of the two.
    **Second round, 2026-09-01, four harder tests — and the verdict flipped from
    "retire" to "keep, but scoped".** Serena is not redundant; it wins two
    things outright and loses find-references badly in monorepos.
  - **Test 1, new uncommitted component** (`ShortcutHint`, ground truth 3
    files): serena 2/3, silently missing the test file. **Cause diagnosed and it
    is not serena's bug** — `apps/web/tsconfig.json` excludes `**/*.test.tsx`,
    so test files are genuinely not in the TypeScript program. codegraph 3/3 and
    named the test as coverage.
  - **Test 2, the hard one — same symbol name in two packages, consumed through
    an aliased cross-package import** (`assignInvoiceCompany` in `packages/core`
    vs the server action of the same name in `apps/web`; ground truth: **5
    files** reference the core one, one of them as
    `import { assignInvoiceCompany as assign }` and used as `assign(` — a usage
    no text search can attribute). **serena found 1 of 5**, the barrel re-export
    only: the LSP program that owns `packages/core` does not include `apps/web`,
    so cross-package references are invisible to it, with no warning.
    **codegraph surfaced all 5** and uniquely found
    `apps/worker/src/assignInvoiceCompanyCli.ts`, which a grep of `apps/web`
    also misses — **but it attributed three of them to the wrong one of the two
    same-named symbols**. So neither is trustworthy alone for a rename here; the
    failure modes differ in cost, and codegraph's (over-inclusive, wrong
    grouping) is far safer than serena's (under-inclusive, silent).
  - **Test 3, diagnostics — serena wins outright.** A deliberate
    `const x: number = 'not a number'` injected into
    `sumPurchaseRegisterMoney.ts` came back instantly as TS **2322** with the
    exact message, range and owning symbol, **without running a build**.
    codegraph has no equivalent. (File restored; tree clean.)
  - **Test 4, Python — serena wins on setup.** `max_lane_call` in `atrium`,
    ground truth 2 references including one **function-local import**: serena
    found both and named the enclosing function `_synthesize` (354-453), which
    is more useful than grep's bare line number. **`atrium` has no codegraph
    index at all**, so codegraph could not answer; serena needed no indexing
    step. **Conclusion:** keep serena for the two jobs it actually wins —
    **diagnostics without a build**, and **single-package or unindexed repos** —
    and never trust its find-references inside the pnpm monorepos. **Acted on
    the same day, on the owner's instruction, and this half is done:**
  - [x] Root cause of the 0 calls found: **both** `~/.claude/rules/serena.md`
        and `~/.claude/rules/codegraph.md` had been deleted and neither existed
        any more. Codegraph survived only because `CLAUDE.md` names it; serena
        had nothing pointing at it, so it never won a call. `~/.claude/` is
        unversioned, so there is no history to recover them from — the second
        time that has bitten and an argument for the open item about versioning
        it.
  - [x] Replacement written: **`~/.claude/rules/code-navigation.md`**, covering
        both tools, the three silent-failure modes, and a verify-before-refactor
        rule (confirm any reference list with an independent `grep -rn` before a
        rename; treat one tool's list as a lower bound). **Verified loading in
        both profiles** by print-mode query, not assumed.
  - [x] Index coverage closed: was 89 both / 3 codegraph-only / 5 serena-only /
        **39 with neither**; now **123 repos with source carry both**, zero
        gaps, via the new idempotent `bin/index-all-repos.sh` (13 repos with no
        source files are skipped by design). Both index dirs were already in the
        global gitignore, so no repo was polluted.
  - [x] Findings written to the brain: `topics/codegraph.md`, new section
        "CodeGraph vs Serena, measured head-to-head here", plus two corrections
        to that page's stale claims that every repo was indexed and that
        `~/.claude/rules/codegraph.md` recorded the division.
  - [ ] **Re-measure serena's call count around 2026-10-01.** The whole point of
        the rule is to give it the two jobs it wins; if it is still at 0 calls
        with the rule in place and loading, the experiment is over and it goes.
        Detail stale on 2026-09-04: `~/p/mem/.codegraph` now exists (from
        `index-all-repos.sh`), so "atrium has no codegraph index" no longer
        holds; the 2026-10-01 re-measure stands. Coverage re-checked 2026-09-07
        across the 139 git repositories directly under `~/p`: exactly **one**
        had drifted - `max-lane`, created 2026-09-01 after the sweep, carried
        `.serena/` but no `.codegraph/`. Indexed on the spot (`codegraph init`:
        26 files, 102 nodes, 258 edges), so the two indexes agree again on every
        repo. That is the failure mode to expect: not decay, but each new
        repository.
- [~] Read-to-edit ratio computed 2026-09-01 over `~/.claude/projects/` (3.3 GB,
  4,743 transcripts; `~/.claude-favish/projects/` is a symlink to it): Read
  29,807 vs Edit 17,764 + Write 16,632 = **0.87 reads per edit** — far below
  AMD's 6.6->2 regression band, though Write here includes new-file creation,
  which inflates the denominator against AMD's definition. Remaining half: run
  `/insights` from an interactive CLI session (user command, cannot be run from
  inside a session). Source: `~/p/brain/topics/claude-code-practice.md`.

## Conversations export

- [ ] **Publishing the archive costs a full rewrite, and the archive is 6.3
      GB.** Routed from `~/p/TODO.md` on 2026-09-08 (measured there the same day
      while diagnosing a four-hour stall). The archive holds **44,685 records in
      6,301,948,913 bytes** - 140 KB average, largest single record 21.7 MB -
      and every applied import republishes all of it: hash the whole store to
      build the manifest, copy the archive to a backup, serialize the whole
      store again to a temporary file, rename. A parse-and-hash pass measures
      **32 MB/s (231 records/s)**, so one pass is ~3.2 minutes and a publication
      is three full traversals plus a 6.3 GB copy, all inside the write lock.
      Five publications a day - four in `sync-conversations sync`, one an hour
      from `atrium-refresh` when it wins the lock - is over 30 GB of rewriting a
      day to append a few hours of conversation, and while a publication runs
      nothing else can update the index, which is what makes the corpus go
      stale. The worst constant factor is already gone (records are no longer
      JSON-parsed on the read path) and concurrent publications are safe, but
      the shape is still O(archive) per import. Smallest next step: measure a
      publication end to end with the parse removed, then decide between an
      append-only segment layout (the machinery already exists in
      `scripts/lib/conversations/publishConversationCapture.ts`) and keeping the
      store's content hash incrementally so the manifest costs no traversal at
      all.

- [ ] An interrupted `--apply` leaves `archive.jsonl.tmp-<pid>` behind (2.97 GB
      on 2026-09-04) and nothing removes it. The backup pruning that landed on
      2026-09-09 leaves it alone on purpose: a live pid may still be writing it.
      Smallest step: at the start of an apply, remove temporaries whose pid is
      gone (`process.kill(pid, 0)` throwing ESRCH, the test
      `isArchiveLockAbandoned` already uses), and count them in the result.

- [~] **Both Macs must be able to reference every conversation, and the archive
  is already the place for that - the brain just does not read it.** Owner's
  direction, 2026-09-03. Of the three gaps, (1) and (2) closed on 2026-09-09
  (`TODO_LOG.md`): every captured record now carries `hosts` - the labels of the
  machines that read it, outside the fragment identity and unioned wherever
  fragments meet - and the Favish desktop profile is a capture root. What is
  left is measurement and the brain side. Measure after the next hourly refresh
  on each Mac:
  `LC_ALL=C grep -c '"hosts":' ~/.local/share/rocket-agents/conversations/archive.jsonl`
  (0 before the change; expect every conversation whose source still exists on
  that Mac, and both labels after the next daily sync). Then (3): point
  `~/p/brain/tools/sessions/convert.py` at the archive's `hosts` and retire the
  rsync mirror `sources/agent-sessions/hosts/macmini/` - brain work, tracked
  there in the AI-conversation-inventory item, which already names this
  repository as its precondition. The label defaults to the short hostname
  (`macbook-pro-de-cristian`); `ROCKET_AGENTS_HOST` overrides it and is filed in
  `~/p/dotfiles/TODO.md` so both launchd jobs name the Macs the way the rest of
  the tooling does.

- [!] **Run `conversations:rewrite --apply` once on each Mac: it removes the
  absolute home from 5,121 stored `workspace` values (56,369 event texts, 1,462
  titles) and 1.19 GB of repeated `provenance.relativePath`.** The command
  landed on 2026-09-09 (`TODO_LOG.md`), Codex-adjudicated and reviewed. Proven
  on an APFS clone of the live archive in an OS temporary directory the same
  day: 46,278 records, 6,231 rewritten, 6.69 GB to 5.49 GB, 0 `/Users/` left
  anywhere in the file, every id, source hash, event id and host kept, manifest
  verified, second pass a fixed point, 6:18 wall. Dry run against the live
  archive gives the same counts in 1:37 and writes nothing. **Blocked on:** your
  go for a `--apply` against durable user data (`AGENTS.md`: never without
  explicit human authorization) - on both Macs, with the same `--home`, or the
  daily sync leaves the mini's copies unredacted (equal source hashes make them
  `duplicate`, so neither side overwrites the other). Exact commands, each under
  the same flock the refresh and the sync take:
  `~/.local/bin/atrium-lock --wait 5400 ~/.local/state/rocket-agents/archive.lock pnpm run conversations:rewrite -- --archive ~/.local/share/rocket-agents/conversations/archive.jsonl --home "$HOME"`
  (dry, safe any time), then the same line with `--apply`. It takes the archive
  write lock, checks the revision before and after, leaves the previous archive
  as `archive.jsonl.backup-<stamp>` and prunes older ones; take an instant
  `cp -c archive.jsonl archive.jsonl.pre-rewrite` first if you want a copy
  outside the prune pattern. After:
  `LC_ALL=C grep -c '"workspace":"/Users/' archive.jsonl` is 0. A record at
  schema 1 or a repeated id makes it refuse; both are 0 today.

- [ ] `provenance.relativePath` joins several paths with a comma, and a comma is
      a legal filename character. Pre-existing format choice, made explicit on
      2026-09-09 when the merge started splitting on it to dedup: a source path
      carrying a comma would be split into two entries and re-sorted. Measured
      that day: no artifact path under the Claude, Codex, Cursor or Cowork roots
      on this Mac carries one, and splitting every archived value yields 0
      entries that look absolute, empty or traversing. Smallest step: when the
      segment format next changes, carry the paths as an array or join on a
      character no filename can hold, and migrate the joined strings then.

- [ ] Redaction cannot reach an already-archived record. `contentSha256` hashes
      the source artifact, so `mergeFragment` returns `duplicate` when the
      source is unchanged and an improved redactor never revisits the record;
      when the source does change, event ids derive from the redacted text, so
      the re-redacted event gets a new id and the reducer keeps both variants.
      Measured 2026-08-31: across all 30,740 records and 1,704,054 events, the
      current redactor would change nothing, so this is a contingency rather
      than a live exposure - and the sources themselves are unredacted plaintext
      on disk, so rotation, not scrubbing, is the control for a leaked
      credential. The fix in any format is an explicit withdraw-and-republish
      path; recorded for whichever archive format lands.
- [~] Segment archive, stage 2 (`8cc2849`). Landed: atomic content-addressed
  publication (temp write, file fsync, hard link, directory fsync), the
  generation manifest and its base sentinel, one disposable SQLite state holding
  segments, fragments, materialized records, artifact fingerprints and pending
  Atrium deliveries, incremental capture keyed by
  `(source, relativePath, storageKind)` over an `O_NOFOLLOW` fingerprint, a
  chunked v1 migration, a verifier that builds its own state, and
  `conversations:capture|migrate-segments|verify-segments|benchmark-segments`.
  Measured on 25,000 synthetic artifacts, one process per pass: warm no-op 1.91s
  reading 0 bytes and writing no segment; one changed artifact 1.72s reading
  only its 2,096 bytes; one new conversation 1.59s; peak RSS 261 MB on the
  changed pass. Against the measured v1 baselines of 226.91s and 132.36s that is
  132x and 83x. **Remaining, and it is stage 3:** erasure apply/verify, object
  transport between installations, handing the pending slice to
  `atrium ingest --partial`, and the scheduler/hook freeze sentinel. Nothing is
  pointed at `~/.local/share/rocket-agents` yet.
- [!] JSONL suffix resume is deliberately unbuilt. A changed artifact is
  recaptured whole. Measured at 25,000 artifacts the changed pass costs 1.72s
  against a 22.691s bound, so the checkpoint machinery - prefix chunk hashes, a
  cached normalized accumulator, an incomplete-tail boundary - is correctness
  surface nobody is paying for yet. Build it when a real artifact misses the
  bound, not before. **Blocked on:** a real artifact missing the 22.691 s bound;
  none has (re-checked 2026-09-09, the changed pass measures 1.72 s). Smallest
  unblock: a measured miss.
- [ ] A capture publishes at most 2,000 fragments per segment
      (`CONVERSATION_SEGMENT_FRAGMENT_LIMIT`). The bound exists because staged
      fragments live in memory: at 25,000 artifacts in one segment, peak RSS
      reached 602 MB and the segment was 44 MB. The number is a guess informed
      by one measurement; revisit it when the first real seeding pass runs.

## Cross-project

- [ ] **brain: read `hosts` from the Rocket Agents archive and retire the
      macmini rsync mirror.** Filed 2026-09-09 when capture started stamping
      hosts (`conversationHostLabel.ts`); the brain's own backlog already
      carries the item ("the durable fix is `convert.py` reading that archive
      once records carry a host") and was being edited by another session when
      this was filed, so the pointer lives here until that tree is clean.
      Evidence: `TODO_LOG.md` 2026-09-09, "every captured record names the
      machine that read it".

## Baseline gate debt

Adoptados los gates de `@busirocket` en pleno el 2026-08-26.

Nada abierto: los 60 ficheros muertos se borraron el 2026-08-31 y `knip` entro
en `pnpm run check` a traves de `check:quality`.

## Daily round

Filed by `~/p/bin/daily`; one bullet per finding, updated in place while it
repeats.

- [ ] <!-- daily-tasks:COMMIT_FAIL --> **COMMIT_FAIL** (first seen 2026-09-12,
      last seen 2026-09-12): the daily checkpoint cannot commit (main, 2 dirty):
      Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'eslint-plugin-import'
      imported from /Users/cristiandeluxe/p/rocket-ag.

## Shared package scope migration (2026-09-14)

- [ ] After the owner publishes the renamed shared packages, regenerate the
      lockfile and run the existing repository quality gate. Source references
      now use the new scope; the lockfile is intentionally unchanged because the
      packages are not available offline.
