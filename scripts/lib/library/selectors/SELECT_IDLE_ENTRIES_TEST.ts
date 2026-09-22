import assert from 'node:assert/strict'
import test from 'node:test'
import { IDLE_BASE } from '../fixtures/IDLE_BASE'
import type { CurationManifest } from '../types/CurationManifest'
import { selectIdleEntries } from './selectIdleEntries'

void test('an adopted third-party skill idle past the grace period is parked', () => {
  assert.deepEqual(
    selectIdleEntries({ ...IDLE_BASE, invocations: { used: 3 } }),
    ['idle'],
  )
})

void test('a skill promoted today is never parked before it has had a chance to fire', () => {
  const idle = selectIdleEntries({ ...IDLE_BASE, invocations: {} })
  assert.equal(idle.includes('justPromoted'), false)
})

void test('our own skills are never auto-parked, however quiet they are', () => {
  assert.equal(
    selectIdleEntries({ ...IDLE_BASE, invocations: {} }).includes('ours'),
    false,
  )
})

void test('something already parked is not proposed again', () => {
  assert.equal(
    selectIdleEntries({ ...IDLE_BASE, invocations: {} }).includes('parked'),
    false,
  )
})

void test('an invoked skill is left alone', () => {
  assert.deepEqual(
    selectIdleEntries({ ...IDLE_BASE, invocations: { used: 1, idle: 1 } }),
    [],
  )
})

void test('an entry with no decision date is left alone rather than assumed old', () => {
  const undated: CurationManifest = {
    version: 1,
    entries: { x: { state: 'adopted', source: 'someone/upstream' } },
  }
  assert.deepEqual(
    selectIdleEntries({ ...IDLE_BASE, manifest: undated, invocations: {} }),
    [],
  )
})
