# Feedback-loop ladder (brp-debug reference)

Build the tightest red-capable loop you can, in this preference order. Stop at
the first rung that reaches the bug:

1. A failing test at whatever seam reaches the bug.
2. A curl/HTTP script.
3. A CLI run on a fixture, diffed against a known-good snapshot.
4. A headless browser script.
5. Replay of a captured trace.
6. A throwaway harness: minimal subset, mocked dependencies, one function call.
7. A property/fuzz loop (for example 1000 random inputs).
8. A bisection harness wired for `git bisect run`.
9. A differential loop: old version vs new, diff the outputs.
10. A human-in-the-loop script, as last resort, structured so captured output
    still feeds back.

## Loop quality bar

- Red-capable: it asserts the user's exact symptom, not "runs without erroring".
- Deterministic: pin time, seed randomness, isolate the filesystem, freeze the
  network.
- Fast: seconds, not minutes. A 30-second flaky loop is barely better than no
  loop; a 2-second deterministic one is a debugging superpower.
- Agent-runnable unattended.

Treat the loop as a product: keep tightening it - faster, sharper signal, more
deterministic. Confirm it reproduces the user's failure mode, not a different
failure that happens to be nearby; wrong bug means wrong fix.

## Non-deterministic bugs

The goal is not a clean repro but a higher reproduction rate: loop 100x,
parallelise, add stress, inject sleeps. A 50%-flake bug is debuggable; a 1% one
is not.

## When you genuinely cannot build a loop

Stop and say so, list what you tried, and ask for environment access, a redacted
captured artifact (HAR, log dump, core dump, timestamped recording), or
permission for temporary instrumentation. Do not proceed to hypothesise without
a loop.
