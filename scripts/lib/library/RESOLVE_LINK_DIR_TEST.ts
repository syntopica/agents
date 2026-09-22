import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { resolveLinkDir } from './resolveLinkDir'

void test('claude falls back to its own skills directory', () => {
  assert.equal(
    resolveLinkDir({ into: undefined, target: 'claude', home: '/home/u' }),
    join('/home/u', '.claude', 'skills'),
  )
})

void test('another target without --into has no destination', () => {
  // Falling back to Claude's directory filled it with codex-compiled skills.
  assert.equal(
    resolveLinkDir({ into: undefined, target: 'codex', home: '/home/u' }),
    undefined,
  )
  assert.equal(
    resolveLinkDir({ into: undefined, target: 'antigravity', home: '/home/u' }),
    undefined,
  )
})

void test('an explicit --into wins for every target', () => {
  assert.equal(
    resolveLinkDir({
      into: '/home/u/elsewhere/skills',
      target: 'antigravity',
      home: '/home/u',
    }),
    '/home/u/elsewhere/skills',
  )
  assert.equal(
    resolveLinkDir({
      into: '/home/u/elsewhere/skills',
      target: 'claude',
      home: '/home/u',
    }),
    '/home/u/elsewhere/skills',
  )
})
