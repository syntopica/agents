import assert from 'node:assert/strict'
import test from 'node:test'
import { flagValues } from './flagValues'

void test('repeatable flags preserve every supplied value', () => {
  assert.deepEqual(
    flagValues(
      ['node', 'command', '--sessions', '/active', '--sessions', '/archive'],
      '--sessions',
    ),
    ['/active', '/archive'],
  )
})

void test('an absent or valueless repeatable flag contributes nothing', () => {
  assert.deepEqual(flagValues(['node', 'command'], '--sessions'), [])
  assert.deepEqual(
    flagValues(['node', 'command', '--sessions'], '--sessions'),
    [],
  )
})
