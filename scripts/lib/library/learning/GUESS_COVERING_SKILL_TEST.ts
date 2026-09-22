import assert from 'node:assert/strict'
import test from 'node:test'
import { GUESS_CATALOG as catalog } from './fixtures/GUESS_CATALOG'
import { guessCoveringSkill } from './guessCoveringSkill'

void test('a procedure naming a skill guesses that skill', () => {
  assert.equal(guessCoveringSkill('sign pdf digitally', catalog)?.skill, 'pdf')
})

void test('a procedure whose vocabulary appears nowhere guesses nothing', () => {
  assert.equal(guessCoveringSkill('read discord messages', catalog), undefined)
})

void test('majority vocabulary overlap is enough without the name', () => {
  const guess = guessCoveringSkill('draft internal status report', catalog)
  assert.equal(guess?.skill, 'pm-skills/team-communications')
})

void test('an empty procedure guesses nothing', () => {
  assert.equal(guessCoveringSkill('', catalog), undefined)
})
