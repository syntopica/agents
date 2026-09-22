import assert from 'node:assert/strict'
import { delimiter } from 'node:path'
import test from 'node:test'
import { createManagedAgentCliEnvironment } from './createManagedAgentCliEnvironment'

void test('non-interactive doctors prepend the managed user binary directory', () => {
  const original = { PATH: '/usr/bin:/bin', KEEP: 'value' }
  const result = createManagedAgentCliEnvironment('/Users/example', original)
  assert.equal(
    result['PATH'],
    ['/Users/example/.local/bin', original.PATH].join(delimiter),
  )
  assert.equal(result['KEEP'], 'value')
  assert.equal(original.PATH, '/usr/bin:/bin')
})
