import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalizeProcedureNames } from './canonicalizeProcedureNames'

void test('the todo cluster collapses to its most frequent variant', () => {
  const names = [
    ...Array.from({ length: 23 }, () => 'execute todo backlog'),
    ...Array.from({ length: 19 }, () => 'execute todo list'),
    ...Array.from({ length: 17 }, () => 'execute todo workflow'),
    ...Array.from({ length: 8 }, () => 'execute todo file'),
    ...Array.from({ length: 6 }, () => 'run todo workflow'),
  ]
  const mapping = canonicalizeProcedureNames(names)
  const canonical = new Set(Object.values(mapping))
  assert.equal(canonical.size, 1)
  assert.equal(mapping['run todo workflow'], 'execute todo backlog')
})

void test('procedures that merely share one word stay apart', () => {
  const mapping = canonicalizeProcedureNames([
    'report status on task progress',
    'report batch processing progress',
  ])
  assert.equal(new Set(Object.values(mapping)).size, 2)
})

void test('a different action on the same subject stays apart', () => {
  const mapping = canonicalizeProcedureNames([
    'execute todo backlog',
    'update todo list',
  ])
  assert.equal(new Set(Object.values(mapping)).size, 2)
})

void test('case and whitespace variants are the same name', () => {
  const mapping = canonicalizeProcedureNames([
    'Read Discord Messages',
    'read discord messages',
  ])
  assert.deepEqual(Object.keys(mapping), ['read discord messages'])
})

void test('the representative is the highest-count variant, not the first seen', () => {
  const names = [
    'execute todo list',
    'execute todo backlog',
    'execute todo backlog',
  ]
  const mapping = canonicalizeProcedureNames(names)
  assert.equal(mapping['execute todo list'], 'execute todo backlog')
})
