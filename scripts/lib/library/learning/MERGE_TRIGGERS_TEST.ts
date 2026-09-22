import assert from 'node:assert/strict'
import test from 'node:test'
import type { CurationManifest } from '../types/CurationManifest'
import { TRIGGER_KEYS } from './fixtures/TRIGGER_KEYS'
import { mergeTriggersIntoManifest } from './mergeTriggersIntoManifest'

export const TRIGGER_MANIFEST: CurationManifest = {
  version: 1,
  entries: {
    'brp-todo-work': { state: 'adopted' },
    'pm-skills/jira-expert': { state: 'adopted' },
  },
}

void test('measured phrases land on the matching entry', () => {
  const next = mergeTriggersIntoManifest(
    TRIGGER_MANIFEST,
    { 'brp-todo-work': ['ejecuta el backlog'] },
    TRIGGER_KEYS,
    10,
  )
  assert.deepEqual(next.entries['brp-todo-work']?.triggers, [
    'ejecuta el backlog',
  ])
})

void test('a nested entry is matched by its skill name', () => {
  const next = mergeTriggersIntoManifest(
    TRIGGER_MANIFEST,
    { 'jira-expert': ['crea un ticket'] },
    TRIGGER_KEYS,
    10,
  )
  assert.deepEqual(next.entries['pm-skills/jira-expert']?.triggers, [
    'crea un ticket',
  ])
})

void test('a skill absent from the manifest is ignored rather than invented', () => {
  const next = mergeTriggersIntoManifest(
    TRIGGER_MANIFEST,
    { 'not-installed': ['x'] },
    TRIGGER_KEYS,
    10,
  )
  assert.equal(Object.keys(next.entries).length, 2)
})

void test('existing triggers survive and duplicates are not added twice', () => {
  const seeded: CurationManifest = {
    version: 1,
    entries: {
      'brp-todo-work': { state: 'adopted', triggers: ['ejecuta el backlog'] },
    },
  }
  const next = mergeTriggersIntoManifest(
    seeded,
    { 'brp-todo-work': ['ejecuta el backlog', 'corre el todo'] },
    TRIGGER_KEYS,
    10,
  )
  assert.deepEqual(next.entries['brp-todo-work']?.triggers, [
    'ejecuta el backlog',
    'corre el todo',
  ])
})

void test('the cap stops one skill from absorbing every phrase it ever followed', () => {
  const next = mergeTriggersIntoManifest(
    TRIGGER_MANIFEST,
    { 'brp-todo-work': ['a', 'b', 'c'] },
    TRIGGER_KEYS,
    2,
  )
  assert.equal(next.entries['brp-todo-work']?.triggers?.length, 2)
})

void test('the original manifest is left untouched', () => {
  mergeTriggersIntoManifest(
    TRIGGER_MANIFEST,
    { 'brp-todo-work': ['x'] },
    TRIGGER_KEYS,
    10,
  )
  assert.equal(TRIGGER_MANIFEST.entries['brp-todo-work']?.triggers, undefined)
})
