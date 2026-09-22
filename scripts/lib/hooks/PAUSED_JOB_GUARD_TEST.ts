import assert from 'node:assert/strict'
import test from 'node:test'
import { runPausedJobGuard } from './runPausedJobGuard'

/**
 * The hook exists because a pause reads as reversible and is not: on 2026-09-08
 * a `kill -STOP` on an `igir` process group made its stall guard kill the group
 * 32 minutes later. Both halves need testing - firing on every spelling of the
 * stop signal, and staying quiet everywhere else, since a warning on ordinary
 * `kill` calls would be ignored within a session.
 */

void test('fires on every spelling of the stop signal', () => {
  for (const command of [
    'kill -STOP -- -7018',
    'kill -19 45115',
    'kill -s STOP 45115',
    'kill -s SIGSTOP 45115',
    'kill -SIGSTOP 45115',
    'pkill -STOP -f chdman',
    'killall -STOP node',
    'kill -TSTP 45115',
  ]) {
    const context = runPausedJobGuard(command)
    assert.notEqual(context, null, command)
    assert.match(String(context), /renice/, command)
  }
})

void test('stays silent on resuming and on ordinary termination', () => {
  for (const command of [
    'kill -CONT -- -7018',
    'kill -TERM -45115',
    'kill -9 45115',
    'kill -KILL -- -7018',
    'kill -0 45115',
    'pkill -f playwright-mcp',
  ]) {
    assert.equal(runPausedJobGuard(command), null, command)
  }
})

void test('stays silent when STOP is not in a signal position', () => {
  for (const command of [
    'grep -c STOP /var/log/job.log',
    'echo "kill the STOP marker" >> notes.md',
    './bin/stop-server.sh && kill -TERM 1',
    'cat ~/p/arcade/.cache/STOP-list.txt',
  ]) {
    assert.equal(runPausedJobGuard(command), null, command)
  }
})

void test('ignores tools other than Bash', () => {
  assert.equal(runPausedJobGuard('kill -STOP -- -7018', 'Read'), null)
})
