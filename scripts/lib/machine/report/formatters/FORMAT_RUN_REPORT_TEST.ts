import assert from 'node:assert/strict'
import test from 'node:test'
import type { RunReport } from '../../types/RunReport'
import { SAMPLE_RUN_REPORT } from '../fixtures/SAMPLE_RUN_REPORT'
import { formatRunReport } from './formatRunReport'

void test('json output is a single parseable object', () => {
  const parsed = JSON.parse(
    formatRunReport(SAMPLE_RUN_REPORT, true),
  ) as RunReport
  assert.equal(parsed.runId, '2026-08-17T22-04-05-abc')
  assert.equal(parsed.domains.length, 2)
})

void test('human output names each domain and its status', () => {
  const text = formatRunReport(SAMPLE_RUN_REPORT, false)
  assert.match(text, /mcp\s+changed\s+3/)
  assert.match(text, /plugins\s+converged\s+0/)
})

void test('human output carries the messages', () => {
  assert.match(formatRunReport(SAMPLE_RUN_REPORT, false), /add serena to codex/)
})

void test('the run id and profile head the human output', () => {
  assert.match(
    formatRunReport(SAMPLE_RUN_REPORT, false),
    /^run 2026-08-17T22-04-05-abc profile full/,
  )
})
