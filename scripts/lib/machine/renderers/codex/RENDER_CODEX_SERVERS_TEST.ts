import assert from 'node:assert/strict'
import test from 'node:test'
import type { McpManifest } from '../../domains/mcp/types/McpManifest'
import { escapeTomlString } from './escapeTomlString'
import { renderCodexServers } from './renderCodexServers'

void test('quotes and backslashes are escaped', () => {
  assert.equal(escapeTomlString('a"b\\c'), '"a\\"b\\\\c"')
})

void test('a stdio server becomes a table with a string array', () => {
  const manifest: McpManifest = {
    servers: {
      codegraph: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'codegraph',
        args: ['serve', '--mcp'],
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.equal(
    toml.trim(),
    [
      '[mcp_servers.codegraph]',
      'command = "codegraph"',
      'args = ["serve", "--mcp"]',
    ].join('\n'),
  )
})

void test('an http server is emitted natively, not through a shell bridge', () => {
  const manifest: McpManifest = {
    servers: {
      context7: {
        targets: ['codex'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(toml, /url = "https:\/\/mcp\.context7\.com\/mcp"/)
  assert.equal(toml.includes('mcp-remote'), false)
})

void test('an http secret reference becomes a runtime environment header', () => {
  const manifest: McpManifest = {
    servers: {
      context7: {
        targets: ['codex'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
    },
  }
  const { toml, missing } = renderCodexServers(manifest, {})
  assert.match(
    toml,
    /\[mcp_servers\.context7\.env_http_headers\]\nCONTEXT7_API_KEY = "CONTEXT7_API_KEY"/,
  )
  assert.deepEqual(missing, [])
})

void test('a literal http header becomes a static header', () => {
  const manifest: McpManifest = {
    servers: {
      local: {
        targets: ['codex'],
        transport: 'http',
        url: 'http://127.0.0.1:3000/mcp',
        headers: { 'X-Client': 'codex' },
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(toml, /\[mcp_servers\.local\.http_headers\]\nX-Client = "codex"/)
})

void test('a startup timeout is emitted in the server table', () => {
  const manifest: McpManifest = {
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'serena',
        startup_timeout_sec: 15,
        required: true,
        default_tools_approval_mode: 'writes',
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(toml, /startup_timeout_sec = 15/)
  assert.match(toml, /required = true/)
  assert.match(toml, /default_tools_approval_mode = "writes"/)
})

void test('env values are emitted in their own sub-table', () => {
  const manifest: McpManifest = {
    servers: {
      paperclip: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'paperclip',
        env: { PAPERCLIP_API_URL: 'http://127.0.0.1:3100' },
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(
    toml,
    /\[mcp_servers\.paperclip\.env\]\nPAPERCLIP_API_URL = "http:\/\/127\.0\.0\.1:3100"/,
  )
})

void test('servers not targeting codex are skipped', () => {
  const manifest: McpManifest = {
    servers: {
      onlyClaude: {
        targets: ['claude-personal'],
        transport: 'stdio',
        command: 'x',
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.equal(toml.trim(), '')
})

void test('a server with an unresolved secret is omitted and reported', () => {
  const manifest: McpManifest = {
    servers: {
      secretive: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'x',
        env: { TOKEN: { from_env: 'ABSENT_TOKEN' } },
      },
    },
  }
  const { toml, missing } = renderCodexServers(manifest, {})
  assert.equal(toml.trim(), '')
  assert.deepEqual(missing, ['ABSENT_TOKEN'])
})

void test('the codex target override is appended to args', () => {
  const manifest: McpManifest = {
    servers: {
      serena: {
        targets: ['codex'],
        transport: 'stdio',
        command: 'uvx',
        args: ['serena'],
        target_overrides: {
          codex: { args_append: ['--context', 'ide-assistant'] },
        },
      },
    },
  }
  const { toml } = renderCodexServers(manifest, {})
  assert.match(toml, /args = \["serena", "--context", "ide-assistant"\]/)
})
