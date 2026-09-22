import assert from 'node:assert/strict'
import test from 'node:test'
import { createRollout } from './fixtures/createRollout'
import { readRolloutHeader } from './readRolloutHeader'

void test('a session_meta header yields only its session id', async () => {
  const path = await createRollout(
    '\n{"type":"session_meta","payload":{"id":"session-123","secret":"ignored"}}\n{"type":"event_msg","payload":{"message":"private"}}\n',
  )

  const result = await readRolloutHeader(path)

  assert.deepEqual(result, {
    path,
    status: 'ok',
    sessionId: 'session-123',
    summary: 'valid session_meta header',
  })
  assert.equal(JSON.stringify(result).includes('private'), false)
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

void test('malformed JSON is reported without returning content', async () => {
  const path = await createRollout('{broken-json\n')

  const result = await readRolloutHeader(path)

  assert.equal(result.status, 'malformed')
  assert.equal(result.summary, 'first record is not valid JSON')
})

void test('a first usable record other than session_meta is malformed', async () => {
  const path = await createRollout('{"type":"event_msg","payload":{}}\n')

  const result = await readRolloutHeader(path)

  assert.equal(result.status, 'malformed')
  assert.equal(result.summary, 'first record is not session_meta')
})

void test('the header reader never scans beyond 64 KiB', async () => {
  const path = await createRollout(
    `${' '.repeat(65_536)}\n{"type":"session_meta"}\n`,
  )

  const result = await readRolloutHeader(path)

  assert.equal(result.status, 'malformed')
  assert.equal(result.summary, 'header exceeds 64 KiB')
})
