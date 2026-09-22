import assert from 'node:assert/strict'
import test from 'node:test'
import { phraseIsCoveredByDescription } from './phraseIsCoveredByDescription'
import { proposeDescriptionEdit } from './proposeDescriptionEdit'

void test('a phrase whose vocabulary already appears is covered', () => {
  assert.equal(
    phraseIsCoveredByDescription(
      'revisa las facturas recurrentes del portal',
      'Closes a VAT quarter per company, reconciling facturas recurrentes del portal',
    ),
    true,
  )
})

void test('a phrase with none of its words in the description is not covered', () => {
  assert.equal(
    phraseIsCoveredByDescription(
      'lee los mensajes de discord del canal',
      'Writes release notes',
    ),
    false,
  )
})

void test('a skill whose triggers are all covered needs no proposal', () => {
  const proposal = proposeDescriptionEdit('x', 'anything', ['one'], () => true)
  assert.equal(proposal, undefined)
})

void test('an uncovered trigger produces a proposal naming it', () => {
  const proposal = proposeDescriptionEdit(
    'x',
    'anything',
    ['lee discord'],
    () => false,
  )
  assert.deepEqual(proposal, {
    skill: 'x',
    description: 'anything',
    uncovered: ['lee discord'],
  })
})

void test('only the uncovered phrases are reported', () => {
  const proposal = proposeDescriptionEdit(
    'x',
    'anything',
    ['kept', 'dropped'],
    (phrase) => phrase === 'dropped',
  )
  assert.deepEqual(proposal?.uncovered, ['kept'])
})
