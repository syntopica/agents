import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyRouterOutcome } from './classifyRouterOutcome'

void test('a phrase that fires the lane owning the skill is correct', () => {
  assert.equal(
    classifyRouterOutcome('invoice-quarter-close', 'invoice-ops'),
    'correct-lane',
  )
})

void test('a phrase that fires nothing is the strongest gap evidence', () => {
  assert.equal(
    classifyRouterOutcome('invoice-quarter-close', undefined),
    'no-lane',
  )
})

void test('a phrase that fires a different lane is a precedence problem, not silence', () => {
  assert.equal(classifyRouterOutcome('frontend-design', 'debug'), 'wrong-lane')
})

void test('a lane with no declared skills never counts as correct', () => {
  assert.equal(
    classifyRouterOutcome('anything', 'environment-ops'),
    'wrong-lane',
  )
})
