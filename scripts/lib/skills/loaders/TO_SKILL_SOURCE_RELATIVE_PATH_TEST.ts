import assert from 'node:assert/strict'
import test from 'node:test'
import { toSkillSourceRelativePath } from './toSkillSourceRelativePath'

void test('a skill compiles under the root that owns it, not the first root', () => {
  assert.equal(
    toSkillSourceRelativePath(
      ['/repo/src/skills', '/instance/skills'],
      '/instance/skills/core/mail-triage',
    ),
    'core/mail-triage',
  )
})

void test('an engine skill still measures against the engine root', () => {
  assert.equal(
    toSkillSourceRelativePath(
      ['/repo/src/skills', '/instance/skills'],
      '/repo/src/skills/core/handoff',
    ),
    'core/handoff',
  )
})

void test('a directory under no root is an error rather than a path of dot-dots', () => {
  assert.throws(
    () => toSkillSourceRelativePath(['/repo/src/skills'], '/elsewhere/core/x'),
    /belongs to no configured root/,
  )
})
