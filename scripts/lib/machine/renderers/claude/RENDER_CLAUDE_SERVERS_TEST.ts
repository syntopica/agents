import assert from 'node:assert/strict'
import test from 'node:test'
import type { McpManifest } from '../../domains/mcp/types/McpManifest'
import { renderClaudeServers } from './renderClaudeServers'

export const manifest: McpManifest = {
  servers: {
    serena: {
      targets: ['claude-personal', 'codex'],
      transport: 'stdio',
      command: 'uvx',
      args: ['serena', 'start-mcp-server'],
      target_overrides: {
        'claude-personal': { args_append: ['--context', 'claude-code'] },
      },
    },
    context7: {
      targets: ['claude-personal'],
      transport: 'http',
      url: 'https://mcp.context7.com/mcp',
      headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
    },
    codexOnly: { targets: ['codex'], transport: 'stdio', command: 'x' },
  },
}

void test('only servers targeting this scope are rendered', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(
    Object.keys(servers).toSorted((a, b) => a.localeCompare(b)),
    ['context7', 'serena'],
  )
})

void test('the target override is appended to args', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(servers['serena'], {
    type: 'stdio',
    command: 'uvx',
    args: ['serena', 'start-mcp-server', '--context', 'claude-code'],
  })
})

void test('a resolved header is written as an environment reference', () => {
  const { servers } = renderClaudeServers(manifest, 'claude-personal', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(servers['context7'], {
    type: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
  })
})

void test('secret references are never rendered as literals', () => {
  const geminiManifest: McpManifest = {
    servers: {
      context7: {
        targets: ['gemini'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
    },
  }

  const { servers } = renderClaudeServers(geminiManifest, 'gemini', {
    CONTEXT7_API_KEY: 'k',
  })
  assert.deepEqual(servers['context7'], {
    type: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
  })
})

void test('a server with an unresolved secret is omitted and reported', () => {
  const { servers, missing } = renderClaudeServers(
    manifest,
    'claude-personal',
    {},
  )
  assert.equal('context7' in servers, false)
  assert.deepEqual(missing, ['CONTEXT7_API_KEY'])
})

void test('a target with no servers renders an empty record', () => {
  const { servers } = renderClaudeServers(manifest, 'gemini', {})
  assert.deepEqual(servers, {})
})

void test('a target env override applies only to that target', () => {
  const overridden: McpManifest = {
    servers: {
      atrium: {
        targets: ['claude-personal', 'claude-secondary'],
        transport: 'stdio',
        command: 'atrium-mcp',
        env: { LOG_LEVEL: 'info' },
        target_overrides: {
          'claude-secondary': {
            env: { SYNTOPICA_DATA: '/data', LOG_LEVEL: 'debug' },
          },
        },
      },
    },
  }

  const personal = renderClaudeServers(overridden, 'claude-personal', {})
  const secondary = renderClaudeServers(overridden, 'claude-secondary', {})
  assert.deepEqual(personal.servers['atrium'], {
    type: 'stdio',
    command: 'atrium-mcp',
    env: { LOG_LEVEL: 'info' },
  })
  assert.deepEqual(secondary.servers['atrium'], {
    type: 'stdio',
    command: 'atrium-mcp',
    env: { LOG_LEVEL: 'debug', SYNTOPICA_DATA: '/data' },
  })
})
