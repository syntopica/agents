import assert from 'node:assert/strict'
import test from 'node:test'
import { runBackgroundJobGuard } from './runBackgroundJobGuard'

/**
 * The hook exists because a guard that is available but unused is worth
 * nothing: a PSX conversion was relaunched bare on 2026-09-03 and sat stalled
 * for 1h47m. Both halves need testing - firing on a real background launch,
 * and staying quiet everywhere else, since a reminder on every Bash call would
 * be ignored within a session.
 */

void test('fires on a backgrounded long job', () => {
  for (const command of [
    'nohup bin/convert-psx-to-chd.sh 8 > /dev/null 2>&1 &',
    'cd ~/p/arcade && ./run-import.sh &',
    'setsid ./sync.sh',
    'python3 train.py > train.log 2>&1 & disown',
  ]) {
    const context = runBackgroundJobGuard(command)
    assert.notEqual(context, null, command)
    assert.match(String(context), /stall guard/, command)
  }
})

void test('fires on run_in_background without shell syntax', () => {
  assert.notEqual(runBackgroundJobGuard('./long-import.sh', true), null)
})

void test('stays silent on foreground commands', () => {
  for (const command of [
    'git status',
    'pnpm run check && pnpm run build',
    'find . -name "*.cue" | wc -l',
    'ps -eo pid,pgid,command | grep chdman',
  ]) {
    assert.equal(runBackgroundJobGuard(command), null, command)
  }
})

void test('stays silent when the launch already carries a guard', () => {
  for (const command of [
    'nohup timeout --kill-after=30s 4h ./job.sh &',
    'nohup bin/igir-with-stall-guard.sh mame dat input &',
    'nohup bin/watch-progress.sh 45115 1800 .cache/done.txt &',
  ]) {
    assert.equal(runBackgroundJobGuard(command), null, command)
  }
})

void test('stays silent on commands that cannot stall for hours', () => {
  assert.equal(runBackgroundJobGuard('sleep 30 &'), null)
  assert.equal(runBackgroundJobGuard('echo started &'), null)
})

void test('ignores tools other than Bash', () => {
  assert.equal(runBackgroundJobGuard('nohup ./job.sh &', true, 'Read'), null)
})
