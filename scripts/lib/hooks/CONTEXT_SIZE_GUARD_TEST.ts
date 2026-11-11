import assert from 'node:assert/strict'
import test from 'node:test'
import { assistantTurn } from './assistantTurn'
import { runContextSizeGuard } from './runContextSizeGuard'
import { writeTranscript } from './writeTranscript'

/**
 * The guard measures the context of the last main-thread assistant turn: input
 * plus both cache counters. Subagent turns run in their own context and must
 * not count, and a missing transcript must never make the hook speak.
 */

void test('fires above the threshold with the measured size', () => {
  const output = runContextSizeGuard(
    writeTranscript([
      assistantTurn(1000),
      { type: 'user' },
      assistantTurn(200_000),
    ]),
  )
  assert.match(String(output?.hookSpecificOutput?.additionalContext), /200k/)
  assert.match(String(output?.systemMessage), /TODO/)
})

void test('stays silent below the threshold', () => {
  assert.equal(
    runContextSizeGuard(writeTranscript([assistantTurn(50_000)])),
    null,
  )
})

void test('ignores subagent turns', () => {
  const file = writeTranscript([
    assistantTurn(20_000),
    assistantTurn(300_000, true),
  ])
  assert.equal(runContextSizeGuard(file), null)
})

void test('stays silent on a missing transcript', () => {
  assert.equal(runContextSizeGuard('/nonexistent/transcript.jsonl'), null)
})

void test('honours the threshold override', () => {
  assert.notEqual(
    runContextSizeGuard(writeTranscript([assistantTurn(50_000)]), '40000'),
    null,
  )
})
