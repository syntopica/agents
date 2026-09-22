import assert from 'node:assert/strict'
import test from 'node:test'
import { stripNpmChatter } from './stripNpmChatter'

void test('npm notice and warn lines are removed', () => {
  const output = [
    'npm warn Unknown env config "manage-package-manager-versions".',
    'npm notice run library:observe',
    'transcripts seen: 3298',
  ].join('\n')

  assert.equal(stripNpmChatter(output), 'transcripts seen: 3298')
})

void test('a stage line that merely mentions npm is kept', () => {
  const output = 'npm ls -g resolved codegraph'

  assert.equal(stripNpmChatter(output), output)
})

void test('output with no chatter is unchanged', () => {
  assert.equal(
    stripNpmChatter('rollouts scanned: 4144\n'),
    'rollouts scanned: 4144\n',
  )
})
