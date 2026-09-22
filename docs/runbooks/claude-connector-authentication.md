# Claude Connector Authentication

Use this runbook when `pnpm run connectors:doctor -- --json` reports
`auth-required`. OAuth state is profile-owned and must never be copied between
Claude configuration roots.

## Personal profile

Close other pending MCP login prompts, then run each command from a local
terminal. Complete Cloudflare browser flows in the user's real Chrome profile.
Use `chrome-cli` to inspect and interact with the tab when automation is
required; isolated Playwright or Chromium profiles can trigger Cloudflare bot
checks. Do not paste callback URLs into logs, issues, commits, or chat
transcripts.

```bash
claude mcp login plugin:cloudflare:cloudflare-api
claude mcp login plugin:cloudflare:cloudflare-bindings
claude mcp login plugin:cloudflare:cloudflare-builds
claude mcp login plugin:cloudflare:cloudflare-observability
```

Verify the same profile after each completed browser flow:

```bash
pnpm run connectors:doctor -- --profile personal --json
```

If the browser does not open, use the one-time URL printed by the CLI. If the
redirect cannot reach the local callback listener, paste the complete redirect
URL only into the waiting CLI prompt. The URL is transient authentication
material and must not be stored.

### A connector behind an Access gateway

On 2026-08-18, Cloudflare Access redirected `/mcp` to HTML and the OAuth attempt
ended with `invalid_target`. Managed OAuth was then enabled on the existing
Gateway Example Access application, and the personal Claude profile completed
dynamic client registration successfully.

Enable Managed OAuth on the existing Access application while preserving every
other application field. The required configuration is:

- `oauth_configuration.enabled = true`
- `oauth_configuration.dynamic_client_registration.enabled = true`
- `oauth_configuration.dynamic_client_registration.allow_any_on_localhost = true`
- `oauth_configuration.dynamic_client_registration.allow_any_on_loopback = true`

Cloudflare requires the full current Access application configuration on update.
The repository client reads the complete application, removes read-only response
fields, modifies only the Managed OAuth configuration, writes the result, and
verifies it with a fresh read. It uses the named Alchemy OAuth profile directly,
so no `.env` file or copied API token is required. The OAuth credential needs
`access:read` and `access:write`. If those scopes are missing, refresh the
profile in the user's real Chrome session:

```bash
pnpm exec alchemy login --profile default --configure
```

Select both Access scopes alongside the existing scopes. The direct client
endpoint map is one resource: `GET` reads and verifies
`/client/v4/accounts/:accountId/access/apps/:applicationId`; `PUT` updates the
same resource. Preview or idempotently apply the change with:

```bash
pnpm run connectors:cloudflare-managed-oauth -- \
  --account-id <account-id> \
  --application-id <application-id>

pnpm run connectors:cloudflare-managed-oauth -- \
  --account-id <account-id> \
  --application-id <application-id> \
  --apply
```

See
[Cloudflare Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/).

After the policy change, verify that an unauthenticated MCP initialize request
returns HTTP 401 with OAuth resource metadata instead of an HTML redirect, then
run:

```bash
claude mcp login gateway-example
pnpm run connectors:doctor -- --profile personal --json
```

## Secondary profile

Secondary-profile credentials are already profile-local. Verify them without
logging out, logging in, copying credential files, or changing the account
selection:

```bash
CLAUDE_CONFIG_DIR="$HOME/$CLAUDE_SECONDARY_CONFIG_DIR" claude mcp list
pnpm run connectors:doctor -- --profile secondary --json
```

Gateway Example is intentionally not declared for the secondary profile and
therefore remains not applicable to that profile.

## Completion check

After all personal browser flows complete, require both profile inventories to
pass:

```bash
pnpm run connectors:doctor -- --json
pnpm run agents:doctor -- --json
```

An optional hosted connector outage may remain degraded. A required connector
that still needs authentication keeps `connectors:doctor` at exit status 1.
