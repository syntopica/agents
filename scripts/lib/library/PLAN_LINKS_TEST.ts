import assert from 'node:assert/strict'
import test from 'node:test'
import { findLinkCollisions } from './findLinkCollisions'
import { planLinks } from './planLinks'

void test('a top-level bundle links under its own name', () => {
  assert.deepEqual(planLinks('/lib/skills', ['frontend-design']), [
    {
      name: 'frontend-design',
      target: '/lib/skills/frontend-design',
      entryKey: 'frontend-design',
      logicalName: 'frontend-design',
    },
  ])
})

void test('a nested skill links under the skill name, not the bundle name', () => {
  assert.deepEqual(planLinks('/lib/skills', ['pm-skills/jira-expert']), [
    {
      name: 'jira-expert',
      target: '/lib/skills/pm-skills/jira-expert',
      entryKey: 'pm-skills/jira-expert',
      logicalName: 'pm-skills/jira-expert',
    },
  ])
})

void test('two entries claiming the same link name are reported, not silently merged', () => {
  const links = planLinks('/lib/skills', [
    'frontend-design',
    'engineering-skills/frontend-design',
  ])
  const collisions = findLinkCollisions(links)
  assert.equal(collisions.length, 1)
  assert.match(collisions[0] ?? '', /frontend-design is claimed by both/)
})

void test('distinct names produce no collisions', () => {
  assert.deepEqual(
    findLinkCollisions(planLinks('/lib/skills', ['a', 'b/c'])),
    [],
  )
})
