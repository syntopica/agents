import assert from 'node:assert/strict'
import test from 'node:test'
import { isSecretReference } from './isSecretReference'
import { resolveReference } from './resolveReference'

void test('a reference object is recognised', () => {
  assert.equal(isSecretReference({ from_env: 'TOKEN' }), true)
})

void test('a bare string is not a reference', () => {
  assert.equal(isSecretReference('ghp_something'), false)
})

void test('an object with the wrong shape is not a reference', () => {
  assert.equal(isSecretReference({ from_env: 12 }), false)
  assert.equal(isSecretReference({ value: 'TOKEN' }), false)
  assert.equal(isSecretReference(null), false)
})

void test('a present variable resolves to its value', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, { TOKEN: 'abc' })
  assert.deepEqual(result, { resolved: true, value: 'abc' })
})

void test('a missing variable reports the name instead of throwing', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, {})
  assert.deepEqual(result, { resolved: false, name: 'TOKEN' })
})

void test('an empty variable counts as missing', () => {
  const result = resolveReference({ from_env: 'TOKEN' }, { TOKEN: '' })
  assert.deepEqual(result, { resolved: false, name: 'TOKEN' })
})
