import assert from 'node:assert/strict'
import test from 'node:test'
import { readCodexSkillReads } from './readCodexSkillReads'

void test('an explicit skillkit read counts', () => {
  assert.deepEqual(readCodexSkillReads('skillkit read brp-todo-work'), {
    'brp-todo-work': 1,
  })
})

void test('opening a SKILL.md with a read command counts', () => {
  assert.deepEqual(
    readCodexSkillReads('cat ~/.agents/skills/core/brp-docs/SKILL.md'),
    {
      'brp-docs': 1,
    },
  )
})

void test('a bare path in a directory listing is not a read', () => {
  assert.deepEqual(
    readCodexSkillReads('ls: skills/pm-skills/jira-expert/SKILL.md'),
    {},
  )
})

void test('repeated reads accumulate', () => {
  const counts = readCodexSkillReads('skillkit read pdf\nskillkit read pdf')
  assert.equal(counts['pdf'], 2)
})

void test('unrelated text yields nothing', () => {
  assert.deepEqual(readCodexSkillReads('nothing to see here'), {})
})
