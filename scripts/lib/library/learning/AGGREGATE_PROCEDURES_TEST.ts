import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateProcedures } from './aggregateProcedures'
import { chunkRequests } from './chunkRequests'

void test('identical procedures collapse and their count adds up', () => {
  const procedures = aggregateProcedures(
    [
      { procedure: 'read discord messages', project: 'a' },
      { procedure: 'Read Discord Messages', project: 'b' },
    ],
    1,
  )
  assert.deepEqual(procedures, [
    { name: 'read discord messages', requests: 2, projects: 2 },
  ])
})

void test('a procedure below the threshold is dropped', () => {
  assert.deepEqual(aggregateProcedures([{ procedure: 'one off' }], 2), [])
})

void test('empty procedure names are ignored rather than counted as a cluster', () => {
  assert.deepEqual(aggregateProcedures([{ procedure: '  ' }], 1), [])
})

void test('the busiest procedure comes first', () => {
  const procedures = aggregateProcedures(
    [{ procedure: 'rare' }, { procedure: 'common' }, { procedure: 'common' }],
    1,
  )
  assert.equal(procedures[0]?.name, 'common')
})

void test('requests are split into batches of the requested size', () => {
  assert.deepEqual(chunkRequests(['a', 'b', 'c'], 2), [['a', 'b'], ['c']])
})

void test('a batch size below one keeps everything in a single batch', () => {
  assert.deepEqual(chunkRequests(['a', 'b'], 0), [['a', 'b']])
})
