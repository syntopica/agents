import assert from 'node:assert/strict'
import test from 'node:test'
import { remapInvocations } from './remapInvocations'

void test('counts recorded under a bare skill name move to its manifest key', () => {
  const remapped = remapInvocations(
    { 'brp-todo-work': 7 },
    { 'brp-todo-work': 'core/brp-todo-work' },
  )
  assert.deepEqual(remapped, { 'core/brp-todo-work': 7 })
})

void test('two skills sharing one bundle entry have their counts summed', () => {
  const remapped = remapInvocations(
    { 'brp-docs': 5, 'brp-release': 4 },
    { 'brp-docs': 'core', 'brp-release': 'core' },
  )
  assert.deepEqual(remapped, { core: 9 })
})

void test('a skill with no mapping keeps its own name', () => {
  assert.deepEqual(remapInvocations({ unknown: 2 }, {}), { unknown: 2 })
})
