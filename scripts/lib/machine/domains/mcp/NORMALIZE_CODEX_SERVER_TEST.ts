import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCodexServer } from './normalizeCodexServer'

void test('a quoted scalar loses its quotes', () => {
  assert.deepEqual(normalizeCodexServer({ command: '"codegraph"' }), {
    command: 'codegraph',
  })
})

void test('an inline array becomes a string array', () => {
  assert.deepEqual(
    normalizeCodexServer({ command: '"x"', args: '["serve", "--mcp"]' }),
    {
      command: 'x',
      args: ['serve', '--mcp'],
    },
  )
})

void test('an empty array is preserved as an empty array', () => {
  assert.deepEqual(normalizeCodexServer({ command: '"x"', args: '[]' }), {
    command: 'x',
    args: [],
  })
})

void test('a url server normalizes to a url', () => {
  assert.deepEqual(
    normalizeCodexServer({ url: '"https://mcp.context7.com/mcp"' }),
    {
      url: 'https://mcp.context7.com/mcp',
    },
  )
})

void test('unrelated keys are ignored', () => {
  assert.deepEqual(normalizeCodexServer({ command: '"x"', FOO: '"bar"' }), {
    command: 'x',
  })
})

void test('startup timeouts and header sub-tables are normalized', () => {
  assert.deepEqual(
    normalizeCodexServer({
      url: '"https://mcp.context7.com/mcp"',
      startup_timeout_sec: '15',
      required: 'true',
      default_tools_approval_mode: '"writes"',
      'env_http_headers.CONTEXT7_API_KEY': '"CONTEXT7_API_KEY"',
    }),
    {
      url: 'https://mcp.context7.com/mcp',
      startup_timeout_sec: 15,
      required: true,
      default_tools_approval_mode: 'writes',
      env_http_headers: { CONTEXT7_API_KEY: 'CONTEXT7_API_KEY' },
    },
  )
})

void test('an escaped quote inside a value is unescaped', () => {
  assert.deepEqual(normalizeCodexServer({ command: '"a\\"b"' }), {
    command: 'a"b',
  })
})
