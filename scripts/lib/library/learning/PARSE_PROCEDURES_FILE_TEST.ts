import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProceduresFile } from './parseProceduresFile'

void test('well-formed procedures parse', () => {
  assert.deepEqual(
    parseProceduresFile([
      { name: 'read discord messages', requests: 8, projects: 4 },
    ]),
    [{ name: 'read discord messages', requests: 8, projects: 4 }],
  )
})

void test('a covering skill is carried when present', () => {
  const parsed = parseProceduresFile([
    { name: 'x', requests: 1, projects: 1, covers: 'pdf' },
  ])
  assert.equal(parsed[0]?.covers, 'pdf')
})

void test('entries missing a name or a count are dropped rather than guessed', () => {
  assert.deepEqual(
    parseProceduresFile([{ requests: 3 }, { name: 'y' }, 'nope']),
    [],
  )
})

void test('a non-array input yields nothing', () => {
  assert.deepEqual(parseProceduresFile({ procedures: [] }), [])
})

void test('a missing project count defaults to one', () => {
  assert.equal(
    parseProceduresFile([{ name: 'x', requests: 2 }])[0]?.projects,
    1,
  )
})
