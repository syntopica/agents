import assert from 'node:assert/strict'
import test from 'node:test'
import { createLiveProbeDefinition } from './fixtures/createLiveProbeDefinition'
import { createProbeExecutable } from './fixtures/createProbeExecutable'
import { runLiveProbe } from './runLiveProbe'

void test('a successful command is healthy', async () => {
  const command = await createProbeExecutable("printf 'Connected\\n'")
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'healthy')
})

void test('an OAuth challenge is auth-required', async () => {
  const command = await createProbeExecutable(
    "printf 'Needs authentication\\n'; exit 1",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'auth-required')
})

void test('a partial discovery failure is degraded', async () => {
  const command = await createProbeExecutable(
    "printf 'Failed to connect\\n'; exit 0",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'degraded')
})

void test('a benign missing optional executable warning remains healthy', async () => {
  const command = await createProbeExecutable(
    "printf 'Ripgrep is not available. Falling back to GrepTool.\\n'",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'healthy')
})

void test('an MCP table auth column does not override a successful command', async () => {
  const command = await createProbeExecutable(
    "printf 'context7 enabled Not logged in\\n'",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'healthy')
})

void test('an empty required MCP inventory is failed', async () => {
  const command = await createProbeExecutable(
    "printf 'No MCP servers configured.\\n'",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'failed')
})

void test('an API-key Codex login fails the ChatGPT security policy', async () => {
  const command = await createProbeExecutable(
    "printf 'Logged in using an API key\\n'",
  )
  const result = await runLiveProbe(createLiveProbeDefinition(command))
  assert.equal(result.status, 'failed')
})

void test('a timeout is failed', async () => {
  const command = await createProbeExecutable('sleep 2')
  const result = await runLiveProbe({
    ...createLiveProbeDefinition(command),
    timeoutMs: 20,
  })
  assert.equal(result.status, 'failed')
  assert.equal(result.timedOut, true)
})
