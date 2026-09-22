import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeInvocationCounts } from './mergeInvocationCounts'

void test('counts for the same skill are summed across surfaces', () => {
  assert.deepEqual(
    mergeInvocationCounts([
      { 'core/brp-docs': 3, brain: 1 },
      { 'core/brp-docs': 2 },
    ]),
    { 'core/brp-docs': 5, brain: 1 },
  )
})

void test('keys are left as measured, since the caller remaps them', () => {
  assert.deepEqual(
    mergeInvocationCounts([{ 'core/brain': 4 }, { brain: 55 }]),
    {
      'core/brain': 4,
      brain: 55,
    },
  )
})

void test('no sources is an empty result rather than a throw', () => {
  assert.deepEqual(mergeInvocationCounts([]), {})
})
