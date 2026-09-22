# AGENTS.md format

The map is one file, `AGENTS.md`, at the repository root, plus `CLAUDE.md`
containing exactly:

```
@AGENTS.md
```

One source, both toolchains. Never maintain two copies.

## What the file is for

A contributor — human or agent — who has never opened this repository must be
able to read it once and then work without re-deriving the stack, without
guessing which branch deploys, and without discovering the local environment's
traps by hitting them.

It is not a README. The README addresses users of the product; AGENTS.md
addresses whoever is about to change it. Open with a pointer to the README so
the split is explicit.

## Sections, in order

Include a section only when the scan produced something for it.

### Header

```markdown
# AGENTS.md

Instructions for AI coding agents working in this repository. Humans: start with
[README.md](README.md).
```

### What this is

The stack with real versions, what the repo actually serves, and to whom. Two or
three sentences, then the component breakdown for a monorepo.

### Blast radius

What breaks if this is deployed wrong, named concretely — the production
hostname, the downstream consumers. Then the prohibition and its complement:

```markdown
**Do not deploy, scale, restart, or run write-mode <tool> in <prod-namespace>
without explicit human authorization.** Read-only inspection
(`kubectl get/describe/logs`, `helm get`, `<tool> status`) is always fine.
```

Naming what _is_ safe matters as much as the prohibition. A reader with only a
prohibition either stops or guesses.

### Branch model

Only the non-obvious parts. Which branch is default, which is released, whether
a merge is a deploy, whether branches have diverged, and which branch a
production fix targets.

### Build and run

The commands, in a block, with the ones a newcomer needs first at the top.
Include how long a cold build takes when it is long enough to look hung.

### Smoke test (verified recipe)

The section that makes the file trustworthy. State the date and environment the
commands were run against, then give commands with their expected output:

````markdown
Every command below was run against <env> on <YYYY-MM-DD> and produced the
stated result.

```bash
curl -s -o /dev/null -w '%{http_code}' <url>   # -> 200
```
````

Include the startup requirement that is not obvious — an env var whose absence
makes the container exit, a port-forward the environment needs.

### Deployment

Pipeline file, trigger, image and tag scheme, registry project, cluster, zone,
namespace, workload name, replica count, rollout strategy. Then the explicit
**never do this** items, each with its reason:

```markdown
- **Never `helm upgrade` this deployment**: the original release is Helm 2 era,
  invisible to Helm 3, and the deployment is orphaned from any chart.
```

A prohibition without its reason gets argued with; one with a reason does not.

### Local environment gaps

Where the documented setup and a working environment diverge. Per item: the
symptom as it appears, the diagnosis, the workaround, and whether the fix
belongs upstream in the repo's own scripts.

### Security

Secret handling, how secrets reach the runtime, and any known history leak with
its rotation status. Identifiers yes, values never.

### Conventions

Language for code and commits, style expectations, whether dependencies may be
upgraded opportunistically, and how large a diff should be.

## Writing rules

- Every command was executed. Nothing is transcribed from a similar project.
- Prefer the specific to the general: `us-central1-a`, not "the usual zone".
- Bold the traps. A reader skimming must catch the dangerous parts.
- Date anything that can go stale — smoke tests, version pins, deploy topology.
- ASCII punctuation; no smart quotes, no invisible characters.
- English, always, regardless of the conversation's language.
- Budget the prose, not the file. Roughly 120 lines of prose is the ceiling;
  past that the file stops being read, and an unread map is worse than none
  because it looks like coverage. Verified command blocks do not count against
  it — they are the part that earns the reader's trust, and trimming them to hit
  a line count is the wrong trade.

## Staleness

A map that disagrees with the code is actively harmful. When the scan shows an
existing AGENTS.md has drifted, correct that section and re-date its smoke test
rather than appending a note beside the wrong line.
