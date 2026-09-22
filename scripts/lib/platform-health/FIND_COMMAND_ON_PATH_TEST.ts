import assert from 'node:assert/strict'
import { chmod, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import test from 'node:test'
import { findCommandOnPath } from './findCommandOnPath'

void test('an executable on PATH is resolved', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'platform-command-'))
  const executable = join(directory, 'agent-cli')
  await writeFile(executable, '#!/bin/sh\n')
  await chmod(executable, 0o755)

  assert.equal(await findCommandOnPath('agent-cli', directory), executable)
})

void test('a non-executable file is ignored', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'platform-command-'))
  await writeFile(join(directory, 'agent-cli'), 'not executable')

  assert.equal(await findCommandOnPath('agent-cli', directory), undefined)
})

void test('all PATH segments are inspected without a shell', async () => {
  const first = await mkdtemp(join(tmpdir(), 'platform-command-'))
  const second = await mkdtemp(join(tmpdir(), 'platform-command-'))
  const executable = join(second, 'agent-cli')
  await writeFile(executable, '#!/bin/sh\n')
  await chmod(executable, 0o755)

  assert.equal(
    await findCommandOnPath('agent-cli', `${first}${delimiter}${second}`),
    executable,
  )
})
