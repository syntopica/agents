import assert from 'node:assert/strict'
import test from 'node:test'
import { applyTransition } from './applyTransition'
import { FAN_OUT_MANIFEST } from './fixtures/FAN_OUT_MANIFEST'

void test('promoting a parked entry to adopted records the date and the reason', () => {
  const result = applyTransition(
    FAN_OUT_MANIFEST,
    'parkedOne',
    'adopted',
    { reason: '24 measured requests' },
    '2026-08-18',
  )
  assert.ok(result.ok)
  const entry = result.manifest.entries['parkedOne']
  assert.ok(entry)
  assert.equal(entry.state, 'adopted')
  assert.equal(entry.decidedAt, '2026-08-18')
  assert.equal(entry.reason, '24 measured requests')
})

void test('an unknown skill is refused by name', () => {
  const result = applyTransition(
    FAN_OUT_MANIFEST,
    'nope',
    'adopted',
    {},
    '2026-08-18',
  )
  assert.ok(!result.ok)
  assert.match(result.error, /not in the library/)
})

void test("a transition that would break the state's obligations is refused", () => {
  const result = applyTransition(
    FAN_OUT_MANIFEST,
    'adoptedEverywhere',
    'forked',
    {},
    '2026-08-18',
  )
  assert.ok(!result.ok)
  assert.match(result.error, /patch/)
})

void test('parking without a reason is refused', () => {
  const result = applyTransition(
    { version: 1, entries: { x: { state: 'adopted' } } },
    'x',
    'parked',
    {},
    '2026-08-18',
  )
  assert.ok(!result.ok)
  assert.match(result.error, /reason/)
})

void test('the original manifest is left untouched', () => {
  applyTransition(
    FAN_OUT_MANIFEST,
    'parkedOne',
    'adopted',
    { reason: 'x' },
    '2026-08-18',
  )
  assert.equal(FAN_OUT_MANIFEST.entries['parkedOne']?.state, 'parked')
})
