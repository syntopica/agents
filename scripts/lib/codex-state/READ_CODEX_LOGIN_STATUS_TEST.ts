import assert from 'node:assert/strict'
import test from 'node:test'
import { createProbeExecutable } from '../platform-health/fixtures/createProbeExecutable'
import { readCodexLoginStatus } from './readCodexLoginStatus'

void test('Codex login output is reduced to a non-secret authentication mode', async () => {
  const chatgpt = await createProbeExecutable(
    "printf 'Logged in using ChatGPT\\n'",
  )
  const api = await createProbeExecutable(
    "printf 'Logged in using an API key\\n'",
  )
  const signedOut = await createProbeExecutable(
    "printf 'Not logged in\\n'; exit 1",
  )

  assert.equal(await readCodexLoginStatus(chatgpt), 'chatgpt')
  assert.equal(await readCodexLoginStatus(api), 'api')
  assert.equal(await readCodexLoginStatus(signedOut), 'signed-out')
})
