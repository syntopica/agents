import assert from 'node:assert/strict'
import test from 'node:test'
import { looksLikeListingArtifact } from './looksLikeListingArtifact'

void test('many skills sharing one count is a catalogue listing, not usage', () => {
  const counts: Record<string, number> = {}
  for (let index = 0; index < 20; index++) {
    counts[`skill-${String(index)}`] = 912
  }
  assert.equal(looksLikeListingArtifact(counts), true)
})

void test('a spread of distinct counts reads as real usage', () => {
  const counts: Record<string, number> = {}
  for (let index = 0; index < 20; index++) {
    counts[`skill-${String(index)}`] = index + 2
  }
  assert.equal(looksLikeListingArtifact(counts), false)
})

void test('too few skills to judge is not called an artifact', () => {
  assert.equal(looksLikeListingArtifact({ a: 5, b: 5 }), false)
})

void test('counts of one are ignored, since a single read proves nothing either way', () => {
  const counts: Record<string, number> = {}
  for (let index = 0; index < 30; index++) {
    counts[`skill-${String(index)}`] = 1
  }
  assert.equal(looksLikeListingArtifact(counts), false)
})

void test('a natural long tail repeating small counts is real usage', () => {
  // Measured 2026-08-24 across 4,144 Codex rollouts, invocations only: 19
  // skills read twice and 13 read three times, with a busiest skill at 55.
  const counts: Record<string, number> = {
    brain: 55,
    'llm-wiki': 31,
    'brp-docs': 24,
  }
  for (let index = 0; index < 19; index++) counts[`twice-${String(index)}`] = 2
  for (let index = 0; index < 13; index++) counts[`thrice-${String(index)}`] = 3

  assert.equal(looksLikeListingArtifact(counts), false)
})

void test('a catalogue cluster near the top still reads as an artifact', () => {
  // The real shape of the poisoned corpus: a long tail of genuine reads plus
  // 17 unrelated skills sitting at exactly 892.
  const counts: Record<string, number> = { 'regulatory-affairs-head': 5708 }
  for (let index = 0; index < 17; index++)
    counts[`catalogued-${String(index)}`] = 892
  for (let index = 0; index < 20; index++)
    counts[`real-${String(index)}`] = index + 2

  assert.equal(looksLikeListingArtifact(counts), true)
})
