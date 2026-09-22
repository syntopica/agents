import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAgentCliExecutable } from './resolveAgentCliExecutable'

void test('managed user agent binaries work without an interactive PATH', () => {
  const executable = resolveAgentCliExecutable(
    'codex',
    '/Users/example',
    { PATH: '/usr/bin:/bin' },
    (path) => path === '/Users/example/.local/bin/codex',
  )
  assert.equal(executable, '/Users/example/.local/bin/codex')
})

void test('PATH and command-name fallbacks remain portable', () => {
  assert.equal(
    resolveAgentCliExecutable(
      'claude',
      '/home/example',
      { PATH: '/opt/bin:/usr/bin' },
      (path) => path.startsWith('/opt/bin/'),
    ),
    '/opt/bin/claude',
  )
  assert.equal(
    resolveAgentCliExecutable(
      'codex',
      '/home/example',
      { PATH: '' },
      () => false,
    ),
    'codex',
  )
})
