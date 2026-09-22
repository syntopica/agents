import assert from 'node:assert/strict'
import test from 'node:test'
import { makeStopGateProject } from './constants/makeStopGateProject'
import { runStopGate } from './runStopGate'

/**
 * The gate has one loud behaviour and several silent ones. Testing only the
 * block would let it regress into blocking everything, or into never firing -
 * the failure that let "it's done" claims through on non-Node projects.
 */

void test('blocks when a failing check exists', () => {
  for (const [label, files] of [
    ['package.json', { 'package.json': '{"scripts":{"check":"exit 1"}}' }],
    ['composer.json', { 'composer.json': '{"scripts":{"check":"exit 1"}}' }],
    ['Makefile', { Makefile: 'check:\n\t@exit 1\n' }],
  ] as [string, Record<string, string>][]) {
    const reason = runStopGate(makeStopGateProject(files, true))
    assert.notEqual(reason, null, `${label}: expected a block`)
    assert.match(String(reason), /Verification gate FAILED/, label)
  }
})

void test('recognizes Codex apply_patch edits', () => {
  const reason = runStopGate(
    makeStopGateProject(
      { 'package.json': '{"scripts":{"check":"exit 1"}}' },
      true,
      'apply_patch',
    ),
  )
  assert.notEqual(reason, null)
  assert.match(String(reason), /Verification gate FAILED/)
})

void test('stays silent when the check passes', () => {
  assert.equal(
    runStopGate(
      makeStopGateProject(
        { 'package.json': '{"scripts":{"check":"exit 0"}}' },
        true,
      ),
    ),
    null,
  )
  assert.equal(
    runStopGate(makeStopGateProject({ Makefile: 'check:\n\t@exit 0\n' }, true)),
    null,
  )
})

void test('stays silent when the project defines no check target', () => {
  assert.equal(
    runStopGate(makeStopGateProject({ 'package.json': '{}' }, true)),
    null,
  )
  assert.equal(
    runStopGate(makeStopGateProject({ 'README.md': 'hi' }, true)),
    null,
  )
})

void test('stays silent when nothing was edited this session', () => {
  assert.equal(
    runStopGate(
      makeStopGateProject(
        { 'package.json': '{"scripts":{"check":"exit 1"}}' },
        false,
      ),
    ),
    null,
  )
})
