import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { LANE_SKILLS } from '../library/learning/constants/LANE_SKILLS'
import { loadRouterExpectations } from './loadRouterExpectations'

void test('every measured phrase appears once with an explicit routing decision', async () => {
  const manifest = await loadRouterExpectations(
    join(process.cwd(), 'src', 'hooks', 'router-expectations.json'),
  )
  const phrases = manifest.expectations.map((expectation) => expectation.phrase)
  const associationCount = manifest.expectations.reduce(
    (count, expectation) => count + expectation.sourceSkills.length,
    0,
  )

  assert.equal(manifest.phraseCount, 107)
  assert.equal(manifest.sourceAssociationCount, 113)
  assert.equal(phrases.length, manifest.phraseCount)
  assert.equal(new Set(phrases).size, phrases.length)
  assert.equal(associationCount, manifest.sourceAssociationCount)
  for (const expectation of manifest.expectations) {
    if (expectation.expectedLane !== undefined) {
      assert.equal(expectation.expectedLane in LANE_SKILLS, true)
    }
  }
})
