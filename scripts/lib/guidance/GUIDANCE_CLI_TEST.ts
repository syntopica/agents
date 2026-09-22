import assert from 'node:assert/strict'
import test from 'node:test'
import { readAliasedGuidanceFlag } from './cli/readAliasedGuidanceFlag'
import { readGuidanceFlag } from './cli/readGuidanceFlag'

void test('guidance commands accept the public config and run spellings', () => {
  const config = '/home/u/dotfiles/agent-guidance'
  assert.equal(
    readAliasedGuidanceFlag(
      ['node', 'doctor', '--config', config, '--json'],
      '--config',
      '--canonical-dir',
    ),
    config,
  )
  assert.equal(
    readAliasedGuidanceFlag(
      ['node', 'rollback', '--run', 'run-1'],
      '--run',
      '--to',
    ),
    'run-1',
  )
})

void test('guidance compatibility aliases remain accepted', () => {
  assert.equal(
    readAliasedGuidanceFlag(
      ['--canonical-dir', '/canonical'],
      '--config',
      '--canonical-dir',
    ),
    '/canonical',
  )
  assert.equal(
    readAliasedGuidanceFlag(['--to', 'run-1'], '--run', '--to'),
    'run-1',
  )
})

void test('guidance flags reject missing and conflicting values', () => {
  assert.throws(
    () => readGuidanceFlag(['--config'], '--config'),
    /missing value/u,
  )
  assert.throws(
    () =>
      readGuidanceFlag(['--config', '/one', '--config', '/two'], '--config'),
    /conflicting values/u,
  )
  assert.throws(
    () =>
      readAliasedGuidanceFlag(
        ['--config', '/one', '--canonical-dir', '/two'],
        '--config',
        '--canonical-dir',
      ),
    /conflicting values/u,
  )
  assert.throws(
    () =>
      readAliasedGuidanceFlag(
        ['--run', 'run-1', '--to', 'run-2'],
        '--run',
        '--to',
      ),
    /conflicting values/u,
  )
})
