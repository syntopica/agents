import assert from 'node:assert/strict'
import test from 'node:test'
import { firstJsonObject } from './firstJsonObject'
import { parseClassifierOutput } from './parseClassifierOutput'

void test('a clean classifier response parses', () => {
  const parsed = parseClassifierOutput(
    '{"requests":[{"procedure":"read discord messages"}]}',
  )
  assert.deepEqual(parsed, [{ procedure: 'read discord messages' }])
})

void test('trailing chatter after the JSON is tolerated', () => {
  const parsed = parseClassifierOutput(
    '{"requests":[{"procedure":"x"}]}\n{"toolAction":"Fixing tool call"}',
  )
  assert.deepEqual(parsed, [{ procedure: 'x' }])
})

void test('the recurring_shape field name is accepted as well', () => {
  const parsed = parseClassifierOutput(
    '{"requests":[{"recurring_shape":"y","project":"p"}]}',
  )
  assert.deepEqual(parsed, [{ procedure: 'y', project: 'p' }])
})

void test('an empty response yields nothing rather than throwing', () => {
  assert.deepEqual(parseClassifierOutput(''), [])
})

void test('a response with no requests array yields nothing', () => {
  assert.deepEqual(parseClassifierOutput('{"other":1}'), [])
})

void test('a nested object inside a string does not end the scan early', () => {
  assert.equal(
    firstJsonObject('{"a":"} not the end","b":1}'),
    '{"a":"} not the end","b":1}',
  )
})
