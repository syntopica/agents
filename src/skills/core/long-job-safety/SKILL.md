---
name: long-job-safety
description:
  Launching, backgrounding, supervising, restarting or killing a long-running
  job, and deciding whether one is actually progressing. Trigger when a job
  expected to run for minutes or hours is about to start, when one is about to
  be reported healthy or relaunched after a stall, and before any process group
  is signalled. Do not use for short foreground commands or for ordinary test
  runs.
allowed-tools: Read, Grep, Glob, Bash
---

# Long-running jobs: verify progress, not liveness

Unscoped on purpose: long jobs get launched from any session, whatever the files
in scope are.

A hashing pass was once checked several times over nineteen hours and called
healthy every time, because the checks asked whether the process was alive
rather than whether anything had moved. It had been looping on a single
mid-sized file since minute five - one `dd` reads end to end in half a minute.

This is the known failure mode, not a local quirk: a process shown as running by
`ps` can be fully deadlocked with zero useful work happening, and a tight loop
pegs `%CPU` exactly like real work. Elapsed time, liveness and CPU are all
worthless as progress signals. This is why CI platforms time out on **silence
rather than duration** - CircleCI's "Too long with no output" defaults to 10
minutes - and why a heartbeat (the link is up) is a different instrument from a
watchdog (the task is advancing).

## Before calling a long job healthy

Name the artifact that moved since the previous check:

- output or cache file grew, or its mtime advanced (`stat -f %m` on macOS,
  `stat -c %Y` on Linux)
- the log gained lines
- the file held open (`lsof -p <pid>`) differs from last time
- a counter the job prints went up

If nothing moved, it is stalled however busy it looks. Say so rather than
reporting progress, and diagnose before relaunching: read the input the job was
chewing on with an independent tool, so a bug in the job is not misdiagnosed as
a corrupt file or a failing disk.

## Admission: the machine is shared and nothing arbitrates

A long job's cost is not paid by the session that starts it. A laptop running
several agent sessions at once can end up with one pass holding most of the
cores for hours, several conversions against a single external volume, an
archive checksum pass, and the backup and indexing daemons all reading what
those jobs wrote. Load average runs in the hundreds all day, swap fills, and the
casualties land in sessions that launched nothing: one loses a headless Chrome
to the OOM killer and reads it as a test failure.

Before launching, measure rather than assume. What matters is the target volume,
not the machine as a whole - two CPU-bound jobs coexist, two jobs seeking the
same spindle do not:

    uptime                                   # load against `sysctl -n hw.ncpu`
    memory_pressure | tail -1                # free percentage, not swap alone
    iostat -d -c 3 -w 1                      # per-disk tps and MB/s
    lsof /Volumes/<target> | awk '{print $1}' | sort | uniq -c | sort -rn

Then state the verdict in the launch report: which volume this job will hold,
what already holds it, and whether you queued behind that or accepted the
contention. **One heavy job per volume** is the default; a second is a decision
with a reason, not an accident. Where the work is genuinely parallel, size the
worker pool to the disk rather than the core count - four media-conversion
workers on one external drive finish no sooner than two and starve everything
else.

Backup and indexing daemons are part of the load and are not yours to stop. An
offsite backup agent, `backupd` and `mdsync` all wait on the same disk, so they
amplify contention rather than causing it; a job that writes gigabytes into an
indexed volume pays for that write twice.

## Arm the guard at launch

**A background job is not launched until its guard is launched.** Both go in the
same turn, and the guard is part of the report: say which artifact it watches
and what threshold kills the job, or do not claim the job is running.
"Relaunched with `nohup`" is an unguarded job and the next check is a manual one
that may not come for hours.

This is the step that gets skipped. The rule can be loaded in the session and a
stall guard can already exist in the repository while a conversion is relaunched
bare anyway - it then holds one worker for nearly two hours and is caught only
because someone asks. Having the guard is not using it.

A job expected to run for hours needs its stall detector from the start, not
after something looks wrong; otherwise it can burn a whole night unobserved.
Bound the blast radius of one pathological input with
`timeout <duration> --kill-after=10s` (exit code 124 means it fired) - per work
item, not only around the run as a whole, so one bad input dies instead of the
batch. Size the stall threshold at 3-5x the expected interval between progress
signs so ordinary slowness does not trip it, and poll on the order of minutes -
polling a long job every few seconds only adds contention. Where the job prints
nothing for long stretches, have it emit a periodic timestamp so silence itself
becomes measurable.

A guard is generic and belongs outside the job it watches: a process group, a
stall threshold, and the artifacts that must move. Welding one to a single tool
means the next long job runs bare, which is exactly what happened above.

    nohup ./the-job.sh > /dev/null 2>&1 &
    nohup ./watch-progress.sh <pgid> 1800 <artifact> [...] >> watch.log 2>&1 &

## Partial progress is still a stall

A job that converted 539 items and then stopped looks nothing like a hang: the
log is long, the outputs are real, and the process list is full. Compare the
progress artifact's mtime against **now**, not against zero. If a counter that
moved every few minutes has not moved in an hour, the run is stalled even though
most of it succeeded.

Suspect the supervisor as readily as the work. `xargs -P` lost its worker count
when one child hung: seven of eight slots stayed empty, the feeding process
blocked on the pipe, and nothing ever ended. When workers are fewer than the
requested parallelism and the feeder is still alive, the pool is broken - a
shell loop with `wait -n`, which reaps its own children, does not have this
failure. A zero-byte or otherwise degenerate input is the usual trigger: check
the one item still in flight before blaming the disk.

## The guard must not match itself

`pgrep -f <pattern>` matches full command lines, so a guard that greps for the
job it watches also matches **its own** command line, and any shell whose
arguments quote that pattern. Two guards and a waiter, all searching for
`git repack`, once kept reporting the repack alive for eight minutes after it
had finished: the pack file was written and already read-only. Had the stall
threshold fired, the guard would have resolved a pgid from that false match and
signalled the session that launched it.

The failure is silent in both directions. A self-matching guard never sees the
job end, so it can kill the wrong process group; a guard whose pattern is too
narrow never sees the job at all and exits at once, leaving the job unguarded
while the launch report claims otherwise. The second happened the same day: a
wrapper that `exec`s its payload is replaced by it, so a guard grepping for the
wrapper's name finds nothing a second after launch.

Watch the pid, not a name. Capture `$!` when you launch, pass it to the guard,
and test with `kill -0 "$pid"`. Where a pattern is unavoidable, exclude self and
the shell (`pgrep -f "$pat" | grep -v "^$$\$"`), match the payload rather than
the wrapper, and prove the guard both sees the running job and stops when it
ends before trusting it.

Progress signals plateau before a job is done. A pack, an archive or an image
reaches full size while the tool is still building its index, so a size-only
watcher reads a finished write as a stall. Pair the size with a second signal -
the process still existing, a log line, the temporary file still present - and
confirm the job is really gone before acting on idleness.

## Killing a stuck job: signal the group

`kill -TERM <script-pid>` does nothing to a shell script blocked in a pipeline.
Bash defers the trap until the foreground command returns, and the stuck
pipeline is precisely what will not return. Signal the whole process group,
which also reaches the workers a `pkill -f <script-name>` never matches:

    ps -eo pid,pgid,command | grep <job>     # read the pgid
    kill -TERM -<pgid>                       # note the leading dash
    kill -KILL -<pgid>                       # if it is still there

**Pausing is not a gentler kill, it is a delayed one.** `SIGSTOP` freezes the
job's artifacts along with the job, and a progress guard reads a frozen artifact
as a stall - it cannot distinguish a paused process from a hung one. A long
conversion run was once paused with `kill -STOP` to relieve system load; its
guard watched that run's cache mtime, saw nothing move for its 1800s threshold,
and killed the group half an hour later. The session that paused it had already
reported the job "paused, reversible with `-CONT`", and the wrong root cause
("memory pressure paged it out") reached the owning repo's TODO.

So before signalling any job this session did not start, look for its guard - a
`timeout` wrapper, a `*-with-stall-guard.sh`, a `guard-*.out` in the repo's
cache - and read the owning repo's TODO. To relieve load without a timer
implication, `renice +10 -p <pid>` yields CPU while the artifacts keep moving.
To relieve disk, there is no safe unilateral move: report the contention and let
the owning session decide.

Then verify by pgid that nothing survived, and clear the run's lock and any
`.partial` files before relaunching - an orphaned worker plus a fresh run
writing the same destination is how one earlier attempt produced 120 bogus
duplicate outputs.

## Shell globs lie when the match list is long

A glob silently expands to nothing once the argument list overflows.
`ls dir/*.ext | wc -l` prints 0 while tens of thousands of matching files are
still there, which reads exactly like "the move finished". Count with
`find <dir> -name '<pattern>' | wc -l`, and treat a sudden clean zero from a
glob as suspect until `find` agrees.
