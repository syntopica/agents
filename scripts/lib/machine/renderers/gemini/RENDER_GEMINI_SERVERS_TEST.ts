import assert from 'node:assert/strict'
import test from 'node:test'
import type { McpManifest } from '../../domains/mcp/types/McpManifest'
import { renderGeminiServers } from './renderGeminiServers'

void test('Gemini renders native stdio, HTTP, SSE, references, headers, and timeouts', () => {
  const manifest: McpManifest = {
    servers: {
      serena: {
        targets: ['gemini'],
        transport: 'stdio',
        command: 'serena',
        args: ['start-mcp-server'],
        env: { LOG_LEVEL: 'info' },
        startup_timeout_sec: 15,
        target_overrides: { gemini: { args_append: ['--project-from-cwd'] } },
      },
      context7: {
        targets: ['gemini'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
      events: {
        targets: ['gemini'],
        transport: 'sse',
        url: 'https://example.test/sse',
      },
    },
  }

  const rendered = renderGeminiServers(manifest, {
    CONTEXT7_API_KEY: 'present',
  })
  assert.deepEqual(rendered, {
    servers: {
      serena: {
        command: 'serena',
        args: ['start-mcp-server', '--project-from-cwd'],
        env: { LOG_LEVEL: 'info' },
        timeout: 15_000,
      },
      context7: {
        httpUrl: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
      },
      events: { url: 'https://example.test/sse' },
    },
    missing: [],
  })
})

void test('Gemini omits a server whose referenced secret is unavailable', () => {
  const manifest: McpManifest = {
    servers: {
      context7: {
        targets: ['gemini'],
        transport: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
      },
    },
  }

  assert.deepEqual(renderGeminiServers(manifest, {}), {
    servers: {},
    missing: ['CONTEXT7_API_KEY'],
  })
})
