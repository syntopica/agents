---
name: claude-profile-safety
description:
  Debugs and updates the two Claude Code account profiles on this machine.
  Trigger when a session is about to start under a different account, when
  shared global configuration is being edited or linked, and when MCP tools or
  an identity are missing for reasons that are not obvious. Covers how each
  profile is started, what is shared by symlink, what must stay per-profile, and
  how to verify a profile actually loaded new configuration. Do not use for
  ordinary work inside one profile.
allowed-tools: Read, Grep, Glob, Bash
---

# Claude Code profiles — two accounts, one shared configuration

Two profiles, no more. Two Anthropic accounts means two quotas; everything that
is not credentials or session state is shared between them by symlink.
Background and repair history: `~/p/wiki/brain/topics/claude-code-profiles.md`.

| profile                                | account               | how to start it                                   | its config file                 |
| -------------------------------------- | --------------------- | ------------------------------------------------- | ------------------------------- |
| **busirocket** (personal, the default) | `info@busirocket.com` | plain `claude`                                    | `~/.claude.json`                |
| **favish**                             | `cristian@favish.com` | `CLAUDE_CONFIG_DIR="$HOME/.claude-favish" claude` | `~/.claude-favish/.claude.json` |

## Never set `CLAUDE_CONFIG_DIR=~/.claude`

It looks like the way to name the personal profile and it is not. Claude Code
keeps its config at `$HOME/.claude.json` when the variable is unset, but at
`$CLAUDE_CONFIG_DIR/.claude.json` when it is set — so pointing it at `~/.claude`
starts a _third_, empty profile at `~/.claude/.claude.json`, with its own login
and none of the MCP servers. It fails silently: servers simply do not appear,
and `claude mcp get` reports them as not configured.

One such file was found on 2026-08-31 holding a single project, one server and
an `oauthAccount` binding `info@busirocket.com` to Favish's organization. It is
parked at `~/.claude-retired/`, not deleted, because it carries auth. The
personal profile is plain `claude`, with no variable set.

## What is shared, and what must never be

`CLAUDE.md` already states the general shape: the canonical directory, what may
be symlinked, what stays per-profile, aligning the MCP lists without printing
env values, absolute hook paths, and serialising plugin updates. Only what it
does not say is here.

- Editing a file under `~/.claude-favish/` directly is a bug: either it belongs
  in `~/.claude` and should be linked, or it is session state — leave it alone.
- **A missing MCP server reads as a broken browser.** A profile missing
  `playwright-busirocket` has no route to that Chrome identity at all, because
  `playwright-chrome` names a different profile's Chrome in each config — and
  the symptom looks like Chrome misbehaving rather than a config gap. Compare
  the two lists first when a browser task fails for want of an identity. Adding
  the server does not help the session that added it: MCP servers are read at
  startup.
- Linking a profile's `.claude.json` collapses both quotas into one login.
- `openseo` (`seo.busirocket.com`) is a BusiRocket service and belongs to the
  personal profile ONLY. That difference is the email-separation rule holding,
  not drift to repair.
- An MCP `command` must be an absolute path. A host spawns servers with a
  minimal PATH, so `command: "uv"` fails silently — the server is listed as
  enabled and its tools never appear. Use `/opt/homebrew/bin/uv`.
- Connectors are authorised server-side per account — connect each one in each
  account, nothing to mirror.

## Verify, do not assume

After adding global config, prove the other profile loads it — a resolving
symlink proves existence, not loading:

    CLAUDE_CONFIG_DIR="$HOME/.claude-favish" claude -p "<question only the new config can answer>"

Quote `$HOME`, never a bare `~`. A tilde is only expanded by an interactive
shell in an assignment it recognises; passed through a script, a heredoc or a
tool that does not expand it, `CLAUDE_CONFIG_DIR` keeps the literal string and
Claude Code creates `./~/.claude-favish/` relative to the working directory - a
third, empty profile with its own login and none of the MCP servers, in a
directory named `~`. That is exactly what happened in `~/p` on 2026-09-04
(`~/p/~/.claude-favish/.claude.json`, a 403-byte stub).

For the personal profile, use `env -u CLAUDE_CONFIG_DIR claude ...` so an
inherited variable cannot send the check to the wrong profile.
