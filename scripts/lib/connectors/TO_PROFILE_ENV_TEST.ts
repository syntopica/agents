import assert from 'node:assert/strict'
import test from 'node:test'
import { toProfileEnv } from './toProfileEnv'

void test('the secondary profile pins its own configuration directory', () => {
  const env = toProfileEnv('claude-secondary', '/home/u', {})

  assert.equal(env['CLAUDE_CONFIG_DIR'], '/home/u/.claude-secondary')
})

void test('the personal profile removes an inherited override', () => {
  // Without this the doctor probed whichever profile launched it: a secondary
  // session made claude-personal's connectors read as missing.
  const env = toProfileEnv('claude-personal', '/home/u', {
    CLAUDE_CONFIG_DIR: '/home/u/.claude-secondary',
    PATH: '/usr/bin',
  })

  assert.equal('CLAUDE_CONFIG_DIR' in env, false)
  assert.equal(env['PATH'], '/usr/bin')
})

void test("the caller's environment is not mutated", () => {
  const base = { CLAUDE_CONFIG_DIR: '/home/u/.claude-secondary' }
  toProfileEnv('claude-personal', '/home/u', base)

  assert.equal(base.CLAUDE_CONFIG_DIR, '/home/u/.claude-secondary')
})
