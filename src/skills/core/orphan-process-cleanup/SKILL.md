---
name: orphan-process-cleanup
description:
  Audits what a machine's memory is actually spent on and reaps the MCP servers,
  watchers and helpers that killed sessions leave behind. Trigger when the
  machine is short of memory or swap, when processes from finished sessions may
  still be running, and when a suite or a browser fails in a way that looks like
  a resource problem rather than a code one. Do not use for stopping a job that
  is currently doing work.
allowed-tools: Read, Grep, Glob, Bash
---

# Process hygiene: reap what you start, and never kill by size

Unscoped on purpose: every session spawns processes, and this machine is shared
by a dozen of them at once.

On 2026-09-08 it held **11 `claude` sessions alive simultaneously** — 4.6 GB
resident between them, swap at 25.6 GB of 26.6 used, 21.9M cumulative pageouts.
A peer session lost a headless Chrome to the OOM killer, and the failure read as
a test failure.

## Reap what you spawn

MCP servers, watchers and helpers die with their session only when it exits
cleanly. A killed session leaves them reparented to `launchd`, where they stay:
three `codegraph` servers were found alive two, three and four days after the
sessions that started them were gone.

The safe test for "nobody is using this" is **`ppid == 1`** — not the name, not
the age, not the size.

```sh
ps -eo pid,ppid,rss,etime,command | grep -E 'mcp|uvx' | grep -v grep | awk '$2==1'
```

Then confirm: `lsof -p <pid>` on a genuinely orphaned stdio server shows
dangling `PIPE` handles and no `TCP` peer. A live socket means something is
still talking to it.

Do not instead walk the ancestor chain for a process named `claude` and call the
rest orphans. Claude Desktop, Orca and other hosts spawn their own MCP servers
under different names, and that heuristic marks all of them as garbage while
they are in use.

## The biggest process is not the expendable one

`ps | sort -rn | head` answers "what is large". It does not answer "what is safe
to kill", and reading the first as the second is how a backup dies to reclaim a
gigabyte.

`bztransmit` was the largest process on this machine and was recommended for
killing on that basis alone. It was mid-backup, and after a 5 TB disk failure
the only live copy of ~1.4 TB of music was inside that upload. Two things the
snapshot hid, both found by measuring twice: the process **recycles itself**
(the pid quoted at 1.2 GB and then at 16 GB had already exited and been
replaced), and the replacement **oscillates** 3.2-4.6 GB rather than growing, so
"RSS climbing" was neither a leak nor progress.

Before proposing to kill anything, answer **what is lost if this dies
half-way**, not only how much memory it frees. A large resident set is usually
the signal that a process is doing the work it exists for. Measure twice, far
enough apart to see a trend, and check the pid is even the same one.

## Read the pressure, not the swap

`swap used` alone is a bad alarm. Pair it with `memory_pressure`: 969 MB of free
swap beside "System-wide memory free percentage: 44%" is days of accumulated
pageouts, not an active shortage — the consequence is that whatever asks for a
lot at once dies first, which is why browser fleets are the usual casualty.

When a suite fails strangely on a loaded machine, check memory before touching
the code, and re-run with `--workers=1` rather than debugging a test that was
killed rather than failed.

Full incident, with the numbers: `~/p/wiki/brain/topics/process-hygiene.md`.
