---
name: brp-rust-quality
description:
  Audits and hardens a Rust or Tauri project's quality gates (clippy lint level,
  rustfmt, deny- warnings, unsafe hygiene, Tauri IPC boundaries). Trigger when
  the task is to bootstrap or improve repo-wide quality gates for a Rust or
  Tauri codebase and a `Cargo.toml` is present. Do not use for TypeScript,
  JavaScript, Python, Go, or PHP projects, isolated bug fixes, feature delivery,
  or behavior-preserving refactors inside a single module.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
paths: Cargo.toml
---

## Rules

- Audit before changing. Report findings first.
- Treat clippy warnings as errors (`-D warnings`). Only silence a lint with a
  scoped `#[allow(...)]` plus a reason.
- Enforce rustfmt so formatting never reaches review.
- Every `unsafe` block needs a safety comment. Flag any that lack one.
- For Tauri, keep the command/IPC surface minimal and validate every input
  crossing the boundary.
- Prefer incremental hardening over a big-bang rewrite.

## Workflow

1. Detect the toolchain, edition, workspace layout, and whether Tauri is
   present.
2. Audit clippy/rustfmt config, `unsafe` usage, feature flags, and the IPC
   surface; report findings.
3. Apply the smallest hardening steps, gated by `cargo clippy` and
   `cargo fmt --check`.
4. Re-run the checks and report what changed, what is left, and any residual
   risk.
