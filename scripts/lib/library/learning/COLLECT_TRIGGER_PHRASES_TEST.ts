import assert from 'node:assert/strict'
import test from 'node:test'
import { collectTriggerPhrases } from './collectTriggerPhrases'

void test("the request immediately before an invocation is that skill's trigger", () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'ejecuta el backlog pendiente' },
      { text: '', invokedSkill: 'brp-todo-work' },
    ],
    200,
  )
  assert.deepEqual(phrases, {
    'brp-todo-work': ['ejecuta el backlog pendiente'],
  })
})

void test('a bare approval is not learned as a trigger, because it did not select anything', () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'adelante con todo' },
      { text: '', invokedSkill: 'brp-todo-work' },
    ],
    200,
  )
  assert.deepEqual(phrases, {})
})

void test('an invocation with no preceding request contributes nothing', () => {
  assert.deepEqual(
    collectTriggerPhrases([{ text: '', invokedSkill: 'brp-todo-work' }], 200),
    {},
  )
})

void test('the same phrase is recorded once, not once per invocation', () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'ejecuta el backlog pendiente' },
      { text: '', invokedSkill: 'brp-todo-work' },
      { text: 'ejecuta el backlog pendiente' },
      { text: '', invokedSkill: 'brp-todo-work' },
    ],
    200,
  )
  assert.deepEqual(phrases['brp-todo-work'], ['ejecuta el backlog pendiente'])
})

void test('a phrase longer than the cap is not treated as a trigger', () => {
  const phrases = collectTriggerPhrases(
    [{ text: 'x'.repeat(500) }, { text: '', invokedSkill: 'brp-todo-work' }],
    200,
  )
  assert.deepEqual(phrases, {})
})

void test('only the nearest preceding request counts, not every earlier one', () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'primero esto' },
      { text: 'ahora ejecuta el backlog pendiente' },
      { text: '', invokedSkill: 'brp-todo-work' },
    ],
    200,
  )
  assert.deepEqual(phrases['brp-todo-work'], [
    'ahora ejecuta el backlog pendiente',
  ])
})

void test('two skills keep their own phrases', () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'ejecuta el backlog pendiente' },
      { text: '', invokedSkill: 'brp-todo-work' },
      { text: 'resume donde lo dejamos' },
      { text: '', invokedSkill: 'project-continuation' },
    ],
    200,
  )
  assert.deepEqual(phrases['project-continuation'], ['resume donde lo dejamos'])
})

void test('a phrase carrying a pasted credential is never stored as a trigger', () => {
  const phrases = collectTriggerPhrases(
    [
      { text: 'no me deja entrar, los datos son Kd%L6zwCMuo&p2As96s' },
      { text: '', invokedSkill: 'brp-todo-work' },
    ],
    200,
  )
  assert.deepEqual(phrases, {})
})
