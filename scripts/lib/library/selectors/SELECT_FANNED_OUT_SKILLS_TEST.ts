import assert from 'node:assert/strict'
import test from 'node:test'
import { FAN_OUT_MANIFEST } from '../fixtures/FAN_OUT_MANIFEST'
import { selectFannedOutSkills } from './selectFannedOutSkills'

void test('adopted and forked fan out, parked and extracted never do', () => {
  assert.deepEqual(
    selectFannedOutSkills(FAN_OUT_MANIFEST, 'claude').toSorted((a, b) =>
      a.localeCompare(b),
    ),
    ['adoptedEverywhere', 'forkedOne'],
  )
})

void test('an entry restricted to one target is absent from the others', () => {
  assert.equal(
    selectFannedOutSkills(FAN_OUT_MANIFEST, 'claude').includes('codexOnly'),
    false,
  )
  assert.equal(
    selectFannedOutSkills(FAN_OUT_MANIFEST, 'codex').includes('codexOnly'),
    true,
  )
})

void test('an entry with no targets reaches every target', () => {
  assert.equal(
    selectFannedOutSkills(FAN_OUT_MANIFEST, 'antigravity').includes(
      'adoptedEverywhere',
    ),
    true,
  )
})

void test('an empty manifest fans out nothing', () => {
  assert.deepEqual(
    selectFannedOutSkills({ version: 1, entries: {} }, 'claude'),
    [],
  )
})

void test('rule entries never fan out through the skill linker', () => {
  assert.deepEqual(
    selectFannedOutSkills(
      {
        version: 1,
        entries: { 'rules/core/general.mdc': { state: 'adopted' } },
      },
      'codex',
    ),
    [],
  )
})
