import assert from 'node:assert/strict'
import test from 'node:test'
import { laneFromContext } from './laneFromContext'

void test('the invoice directive identifies its lane', () => {
  assert.equal(
    laneFromContext(
      'Invoice and tax work. Load the invoice-quarter-close skill',
    ),
    'invoice-ops',
  )
})

void test('the debug directive identifies its lane', () => {
  assert.equal(
    laneFromContext(
      'Use the superpowers:systematic-debugging skill before proposing a fix.',
    ),
    'debug',
  )
})

void test('no context means no lane fired', () => {
  assert.equal(laneFromContext(undefined), undefined)
})

void test('an unrecognised directive is reported as no lane rather than guessed', () => {
  assert.equal(laneFromContext('something entirely different'), undefined)
})
