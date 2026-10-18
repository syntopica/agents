import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { TADU_DOCTOR_ERROR as ERROR } from './constants/TADU_DOCTOR_ERROR'
import { makeFakeTadu as fakeTadu } from './constants/makeFakeTadu'
import { makeTaduHookRepo as repo } from './constants/makeTaduHookRepo'
import { runTaduDoctorHook } from './runTaduDoctorHook'

/**
 * Sessions closed backlog items without running `tadu doctor` in 112 of 183
 * cases, so this hook runs it after the edit. A fake tadu stands in for the
 * real one: the hook's job is routing and reporting, not the checks.
 */

void test('reports doctor errors after an edit of the backlog', () => {
  const dir = repo()
  const context = runTaduDoctorHook(
    { tool_name: 'Edit', tool_input: { file_path: path.join(dir, 'TODO.md') } },
    { TADU_BIN: fakeTadu(1, ERROR) },
  )
  assert.match(String(context), /reports 1 error/)
  assert.match(String(context), /T003/)
})

void test('stays silent when doctor is clean or the file is not the backlog', () => {
  const dir = repo()
  const clean = { TADU_BIN: fakeTadu(0, '') }
  const dirty = { TADU_BIN: fakeTadu(1, ERROR) }
  const edit = (file: string) => ({
    tool_name: 'Write',
    tool_input: { file_path: path.join(dir, file) },
  })
  assert.equal(runTaduDoctorHook(edit('TODO_LOG.md'), clean), null)
  assert.equal(runTaduDoctorHook(edit('README.md'), dirty), null)
  assert.equal(
    runTaduDoctorHook(
      {
        tool_name: 'Read',
        tool_input: { file_path: path.join(dir, 'TODO.md') },
      },
      dirty,
    ),
    null,
  )
})

void test('stays silent in a directory without a backlog', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tadu-none-'))
  const payload = {
    tool_name: 'Write',
    tool_input: { file_path: path.join(dir, 'TODO_LOG.md') },
  }
  assert.equal(
    runTaduDoctorHook(payload, { TADU_BIN: fakeTadu(1, ERROR) }),
    null,
  )
})

void test('checks Bash writes and tadu close, not reads or dry runs', () => {
  const dir = repo()
  const env = { TADU_BIN: fakeTadu(1, ERROR) }
  const bash = (command: string) => ({
    tool_name: 'Bash',
    tool_input: { command },
    cwd: dir,
  })
  for (const command of [
    "python3 - <<'EOF'\nopen('TODO.md','w').write(s)\nEOF",
    'tadu close --match fix --evidence e --write',
    `cd ${dir} && sed -i '' 's/a/b/' TODO_LOG.md`,
  ]) {
    assert.notEqual(runTaduDoctorHook(bash(command), env), null, command)
  }
  for (const command of [
    'grep -n fix TODO.md',
    'tadu close --match fix --evidence e',
    'git status',
  ]) {
    assert.equal(runTaduDoctorHook(bash(command), env), null, command)
  }
})

void test('says so when tadu is missing or does not run', () => {
  const dir = repo()
  const payload = {
    tool_name: 'Edit',
    tool_input: { file_path: path.join(dir, 'TODO.md') },
  }
  assert.match(
    String(runTaduDoctorHook(payload, { TADU_BIN: path.join(dir, 'no-tadu') })),
    /not installed/,
  )
  assert.match(
    String(runTaduDoctorHook(payload, { TADU_BIN: fakeTadu(2, 'boom') })),
    /did not run \(exit 2\)/,
  )
  assert.match(
    String(
      runTaduDoctorHook(payload, { TADU_BIN: fakeTadu(1, 'no findings') }),
    ),
    /did not run \(exit 1\)/,
  )
})

void test('ignores malformed input', () => {
  assert.equal(runTaduDoctorHook({}), null)
})
