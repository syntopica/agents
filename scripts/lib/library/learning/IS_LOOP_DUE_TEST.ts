import assert from 'node:assert/strict'
import test from 'node:test'
import { isLoopDue } from './isLoopDue'

void test('an empty reports directory is always due', () => {
  assert.equal(isLoopDue([], 7, new Date('2026-08-24T13:00:00Z')), true)
})

void test('a report inside the window holds the run back', () => {
  const names = ['2026-08-20-library-loop.md']

  assert.equal(isLoopDue(names, 7, new Date('2026-08-24T13:00:00Z')), false)
})

void test('a report older than the window releases the run', () => {
  const names = ['2026-08-16-library-loop.md']

  assert.equal(isLoopDue(names, 7, new Date('2026-08-24T13:00:00Z')), true)
})

void test('the newest report decides, not the first one read', () => {
  const names = ['2026-08-01-library-loop.md', '2026-08-23-library-loop.md']

  assert.equal(isLoopDue(names, 7, new Date('2026-08-24T13:00:00Z')), false)
})

void test('a file that is not a report is ignored', () => {
  const names = ['README.md', '2026-08-23-notes.md']

  assert.equal(isLoopDue(names, 7, new Date('2026-08-24T13:00:00Z')), true)
})
