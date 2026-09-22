import assert from 'node:assert/strict'
import test from 'node:test'
import type { McpManifest } from '../../domains/mcp/types/McpManifest'
import { renderCursorServers } from './renderCursorServers'

void test('Cursor renders native stdio and remote servers with environment references', () => {
  const manifest: McpManifest = {
    servers: {
      serena: {
        targets: ['cursor'],
        transport: 'stdio',
        command: 'serena',
        args: ['start-mcp-server'],
        env: { LOG_LEVEL: 'info' },
        target_overrides: { cursor: { args_append: ['--context=ide'] } },
      },
      context7: {
        targets: ['cursor'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
      events: {
        targets: ['cursor'],
        transport: 'sse',
        url: 'https://example.test/sse',
      },
    },
  }

  assert.deepEqual(
    renderCursorServers(manifest, { CONTEXT7_API_KEY: 'present' }),
    {
      servers: {
        serena: {
          command: 'serena',
          args: ['start-mcp-server', '--context=ide'],
          env: { LOG_LEVEL: 'info' },
        },
        context7: {
          url: 'https://mcp.context7.com/mcp',
          headers: { CONTEXT7_API_KEY: '${env:CONTEXT7_API_KEY}' },
        },
        events: { url: 'https://example.test/sse' },
      },
      missing: [],
    },
  )
})

void test('Cursor omits unresolved secret-bearing servers', () => {
  const manifest: McpManifest = {
    servers: {
      context7: {
        targets: ['cursor'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
    },
  }
  assert.deepEqual(renderCursorServers(manifest, {}), {
    servers: {},
    missing: ['CONTEXT7_API_KEY'],
  })
})
