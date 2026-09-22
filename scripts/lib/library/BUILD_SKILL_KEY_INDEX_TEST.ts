import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSkillKeyIndex } from './buildSkillKeyIndex'

void test('a skill with its own entry resolves to that entry', () => {
  const index = buildSkillKeyIndex(
    ['pm-skills/jira-expert', 'pm-skills'],
    ['pm-skills/jira-expert'],
  )
  assert.equal(index['jira-expert'], 'pm-skills/jira-expert')
})

void test('a skill inside a bundle entry resolves to the bundle', () => {
  const index = buildSkillKeyIndex(['core'], ['core/brp-todo-work'])
  assert.equal(index['brp-todo-work'], 'core')
})

void test('a top-level bundle resolves to itself', () => {
  const index = buildSkillKeyIndex(['frontend-design'], ['frontend-design'])
  assert.equal(index['frontend-design'], 'frontend-design')
})

void test('a skill whose bundle is not in the manifest resolves to nothing', () => {
  const index = buildSkillKeyIndex(['core'], ['unknown-bundle/some-skill'])
  assert.equal(index['some-skill'], undefined)
})

void test('a specific entry wins over its bundle', () => {
  const index = buildSkillKeyIndex(
    ['pm-skills', 'pm-skills/jira-expert'],
    ['pm-skills/jira-expert', 'pm-skills/team-communications'],
  )
  assert.equal(index['jira-expert'], 'pm-skills/jira-expert')
  assert.equal(index['team-communications'], 'pm-skills')
})
