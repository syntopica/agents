import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveInstanceDir } from './resolveInstanceDir'

void test('the explicit flag wins over everything', () => {
  const dir = resolveInstanceDir({
    flag: '/opt/explicit',
    env: { AGENTS_MACHINE_DIR: '/opt/from-env' },
    root: '/repo',
  })
  assert.equal(dir, '/opt/explicit')
})

void test('the environment variable is used when no flag is given', () => {
  const dir = resolveInstanceDir({
    env: { AGENTS_MACHINE_DIR: '/opt/from-env' },
    root: '/repo',
  })
  assert.equal(dir, '/opt/from-env')
})

void test('it falls back to the tracked machine directory under the repository root', () => {
  const dir = resolveInstanceDir({ env: {}, root: '/repo' })
  assert.equal(dir, '/repo/machine')
})

void test('an empty environment variable is treated as absent', () => {
  const dir = resolveInstanceDir({
    env: { AGENTS_MACHINE_DIR: '' },
    root: '/repo',
  })
  assert.equal(dir, '/repo/machine')
})
