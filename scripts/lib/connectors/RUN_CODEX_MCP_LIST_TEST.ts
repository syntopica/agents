import assert from 'node:assert/strict'
import type { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import test from 'node:test'
import { runCodexMcpList } from './runCodexMcpList'

void test('a non-zero Codex list process rejects without exposing stderr', async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  })
  const running = runCodexMcpList(
    'codex',
    (() => child) as unknown as typeof spawn,
  )
  child.stderr.write('secret-value')
  child.emit('close', 1)
  await assert.rejects(running, /Codex MCP list failed/)
})
