---
name: onepassword-agent-access
description:
  Diagnoses 1Password access from agents - headless reads, Touch ID prompts,
  timeouts, missing tokens. Trigger when a task needs a secret from 1Password,
  when an `op` call fails with `authorization timeout` or `account is not signed
  in`, when an item must be created or moved, and before installing or rotating
  a service account token on a machine. Do not use for browser autofill on a
  login page (that is browser-session-safety) or for storing secrets in a
  repository.
allowed-tools: Read, Grep, Glob, Bash
---

# 1Password from an agent: headless reads, attended writes

Instance data - the wrapper's path, the Keychain service name, the integration
id, which machines hold a token - lives in the instance wiki's access map. Read
it before acting; this skill holds only what is true on any machine.

## Two credential paths, and only one of them is headless

| path                                                 | prompts                                         | can write                   | survives the owner being away |
| ---------------------------------------------------- | ----------------------------------------------- | --------------------------- | ----------------------------- |
| **service account** (`OP_SERVICE_ACCOUNT_TOKEN` set) | never                                           | only if granted at creation | yes                           |
| **desktop app integration** (plain `op`)             | Touch ID per terminal session, again after lock | yes                         | no                            |

A plain `op` on a Mac with the desktop app's CLI integration on authorises
through the app. From an agent, every call is a new session: one fingerprint per
command, and when nobody is there `[ERROR] ... authorization timeout` after
about 60 seconds, then `account is not signed in`. Both read like a broken
token; they are a prompt nobody answered.

So route reads through the service account. Telling agents to call a wrapper
does not hold - they reach for `op` by habit. What holds is an `op` earlier on
`PATH` that sends read subcommands (`read`, `inject`, `run`, `whoami`,
`item get|list`, `document get|list`, `vault get|list`) from a non-interactive
caller to the service account, and everything else to the real binary. Check
which one answered with `op whoami`: `User Type: SERVICE_ACCOUNT` is the
headless path.

## What a service account cannot do

- **Read the built-in Personal, Private or Employee vaults.** 1Password excludes
  them by design; no recreation changes it. Anything an agent must read lives in
  a shared vault.
- **See a vault created after it.** Grants are fixed at creation. A new vault
  means a new service account, the token replaced on every machine, and the old
  one revoked. Create vaults first, the account last.
- **Write, when granted read-only.** `item create|edit|move|delete` then needs
  the desktop path and the owner at the machine. Batch writes for when they are
  there; a long write run also outlives the desktop session and dies midway with
  the timeout above.

## The request budget is per account, and small on personal plans

| plan                        | per token, hourly         | per account, daily  |
| --------------------------- | ------------------------- | ------------------- |
| Individual, Families, Teams | 1,000 read / 100 write    | 1,000 (Teams 5,000) |
| Business                    | 10,000 read / 1,000 write | 50,000              |

The daily figure is shared by every agent on every machine, reads and writes
combined, and some commands spend more than one request. One
`op item list --vault X --format json` filtered locally beats a loop of
`item get`. `op service-account ratelimit` shows what is left. Source:
<https://www.1password.dev/service-accounts/rate-limits/>.

## Keep the value out of the transcript

- Prefer references over values: `op run --env-file .env.tpl -- cmd` and
  `op inject -i tpl -o out` resolve `op://Vault/Item/field` without the value
  passing through the conversation.
- For an interactive login, pipe `op read` into the input channel; the
  `interactive-auth-secrets` rule has the tmux pattern.
- Never print a token or `--reveal` output to inspect it. Check `len=${#value}`
  and a non-secret prefix instead - that is also how an empty value is caught
  (below).

## The token on each machine

The token is stored in the login Keychain and read by the wrapper at call time.
Three traps, each met on a real machine:

- **ssh sessions cannot read the login Keychain.** Keychain unlock is per
  security session; a logged-in console does not unlock it for ssh. The wrapper
  then reports the token as _missing_, which is false. Read it from the GUI
  session instead: write a `~/<name>.command` over ssh, `open -a Terminal` it,
  and have it write only lengths and `op whoami` output to a result file.
- **Replacing an existing item raises a dialog on that machine's screen**
  (`security add-generic-password -U`), and nothing in the ssh session says so.
  Creating one did not. A person has to click it.
- **An install that stalls can leave the item present but empty.** `op` then
  answers `account is not signed in`. After every install, read back the length,
  not the value.

`op` also refuses to run if `~/.config/op` is group- or world-readable
(`permissions are too broad`); `chmod 700` it.

A machine that should not read every vault gets its own service account with a
narrower grant, never a copy of the broad token.

## Prompts that are not the CLI

- **The SSH agent** asks per application, or per application _and terminal
  session_ (Settings > Developer > "Ask approval for each new"). The second
  setting prompts on every new agent shell; choose _application_.
- **1Password for Claude** (browser autofill) asks on every new agent session by
  design. There is no standing grant to configure.

## Self-healing and self-improvement

1Password renames settings, changes plan limits and moves its docs. When a step
here fails, fix the immediate problem, confirm what changed against the current
official documentation or a live command, and replace the stale line in this
file in the same session rather than adding a second version beside it. Record
the machine-specific half of the finding in the instance wiki's access map.
