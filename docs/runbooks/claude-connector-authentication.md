# Connector authentication

Use this runbook when connector diagnostics report `auth-required`. The private
manifest identifies the profile, server, and required capability. Authentication
state belongs to that account and must not be copied between roots or machines.

## Profile-safe login

1. Resolve the affected connector and profile from the private instance.
2. Close stale login prompts owned by the current task before starting another
   flow.
3. Start the connector's supported login flow in a local terminal under the
   intended profile.
4. Complete browser steps in Orca's embedded browser. If its profile lacks the
   login, ask the owner to import the relevant Chrome profile or sign in within
   Orca. The owner's real Chrome is read-only for automation.
5. Verify the same profile afterward. Registration alone does not prove startup
   or tool availability.

Use the installed client's official MCP documentation for its login command:
[Claude Code MCP](https://code.claude.com/docs/en/mcp). Select the server name
from private configuration.

Authorization URLs, callback URLs, cookie values, tokens, and account
identifiers must not enter logs, issues, commits, or transcripts. Enter a manual
callback only into the waiting local CLI prompt.

## Access gateways

An MCP endpoint returning HTML instead of protocol responses may be behind an
access gateway. Inspect that boundary before changing credentials. For
Cloudflare Access, consult
[Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/).

The repository's `connectors:cloudflare-managed-oauth` command accepts an
account ID and application ID, previews changes by default, and writes only with
`--apply`. Its client preserves other application fields and verifies the result
with a fresh read. Obtain authorization for the actual application before using
write mode.

## Completion evidence

Re-run connector and agent diagnostics for the intended instance and profile.
Required authentication or connector failures keep the diagnosis incomplete.
Optional hosted outages can remain degraded when the manifest permits it. Store
account inventories and incident observations privately.
