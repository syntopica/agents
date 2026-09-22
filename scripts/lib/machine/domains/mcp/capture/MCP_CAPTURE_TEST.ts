import assert from 'node:assert/strict'
import test from 'node:test'
import { createDeclaredContext7Manifest } from '../fixtures/createDeclaredContext7Manifest'
import { createEmptyMcpState } from '../fixtures/createEmptyMcpState'
import { captureMcpManifest } from './captureMcpManifest'

void test('a live server is captured with every target that carries it', () => {
  const state = createEmptyMcpState()
  state.byTarget['claude-personal']['serena'] = {
    command: 'serena',
    args: ['start-mcp-server'],
  }
  state.byTarget.cursor['serena'] = {
    command: 'serena',
    args: ['start-mcp-server'],
  }

  const capture = captureMcpManifest({
    state,
    declared: createDeclaredContext7Manifest(),
  })

  assert.deepEqual(capture.manifest.servers['serena'], {
    targets: ['claude-personal', 'cursor'],
    transport: 'stdio',
    command: 'serena',
    args: ['start-mcp-server'],
  })
  assert.deepEqual(capture.refused, [])
})

void test('a concrete value is replaced by the reference the tracked manifest already declares', () => {
  const secret = 'c7-live-value-000'
  const state = createEmptyMcpState()
  state.byTarget['claude-personal']['context7'] = {
    type: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: secret },
  }

  const capture = captureMcpManifest({
    state,
    declared: createDeclaredContext7Manifest(),
  })

  assert.deepEqual(capture.manifest.servers['context7'], {
    targets: ['claude-personal'],
    transport: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
  })
  assert.equal(JSON.stringify(capture).includes(secret), false)
})

void test('a server with an undeclared concrete value is refused instead of captured', () => {
  const secret = 'brave-live-value-000'
  const state = createEmptyMcpState()
  state.byTarget.gemini['brave-search'] = {
    command: 'npx',
    env: { BRAVE_API_KEY: secret },
  }

  const capture = captureMcpManifest({
    state,
    declared: createDeclaredContext7Manifest(),
  })

  assert.equal(Object.hasOwn(capture.manifest.servers, 'brave-search'), false)
  assert.deepEqual(
    capture.refused.map((refusal) => `${refusal.server} ${refusal.field}`),
    ['brave-search env.BRAVE_API_KEY'],
  )
  assert.equal(JSON.stringify(capture).includes(secret), false)
})

void test('a codex http header bound to an environment variable captures as that reference', () => {
  const state = createEmptyMcpState()
  state.byTarget.codex['context7'] = {
    url: '"https://mcp.context7.com/mcp"',
    'env_http_headers.CONTEXT7_API_KEY': '"CONTEXT7_API_KEY"',
  }

  const capture = captureMcpManifest({ state, declared: undefined })

  assert.deepEqual(capture.manifest.servers['context7'], {
    targets: ['codex'],
    transport: 'http',
    url: 'https://mcp.context7.com/mcp',
    headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
  })
  assert.deepEqual(capture.refused, [])
})

void test('a codex environment sub-table with an undeclared value is refused', () => {
  const secret = 'paperclip-live-value-000'
  const state = createEmptyMcpState()
  state.byTarget.codex['paperclip'] = {
    command: '"paperclip-mcp"',
    'env.PAPERCLIP_API_URL': `"${secret}"`,
  }

  const capture = captureMcpManifest({ state, declared: undefined })

  assert.equal(Object.hasOwn(capture.manifest.servers, 'paperclip'), false)
  assert.deepEqual(
    capture.refused.map((refusal) => refusal.field),
    ['env.PAPERCLIP_API_URL'],
  )
  assert.equal(JSON.stringify(capture).includes(secret), false)
})

void test('codex approval and timeout policy is captured, not silently dropped', () => {
  const state = createEmptyMcpState()
  state.byTarget.codex['memstore'] = {
    command: '"memstore-mcp"',
    args: '["--read-only"]',
    required: 'true',
    startup_timeout_sec: '15',
    default_tools_approval_mode: '"writes"',
  }

  const capture = captureMcpManifest({ state, declared: undefined })

  assert.deepEqual(capture.manifest.servers['memstore'], {
    targets: ['codex'],
    transport: 'stdio',
    command: 'memstore-mcp',
    args: ['--read-only'],
    startup_timeout_sec: 15,
    required: true,
    default_tools_approval_mode: 'writes',
  })
})
