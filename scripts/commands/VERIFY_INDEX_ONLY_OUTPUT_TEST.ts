import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyIndexOnlyOutput } from './verifyIndexOnlyOutput'

/**
 * The DoD check guards the router index, not the inlined rule bodies that
 * AGENTS.md carries above it. A rule whose prose cross-references another rule
 * file used to read as a duplicate index entry and failed the build.
 */

void test('a rule reference in inlined prose is not an index duplicate', () => {
  const output = [
    '## Before committing',
    '',
    'The criteria live in `@rules/core/code-quality-guidelines.mdc`; use that one.',
    '',
    '## Rules index (router)',
    '',
    '- `@rules/core/code-quality-guidelines.mdc`',
    '- `@rules/core/general.mdc`',
  ].join('\n')

  const result = verifyIndexOnlyOutput(output, { minRefs: 2 })

  assert.deepEqual(result.errors, [])
  assert.equal(result.ok, true)
})

void test('a repeated entry inside the index still fails', () => {
  const output = [
    '## Rules index (router)',
    '',
    '- `@rules/core/general.mdc`',
    '- `@rules/core/general.mdc`',
    '- `@rules/core/boundaries.mdc`',
  ].join('\n')

  const result = verifyIndexOnlyOutput(output, { minRefs: 2 })

  assert.deepEqual(result.errors, ['Duplicate @rules/ references found'])
})

void test('references above the index do not satisfy the minimum count', () => {
  const output = [
    '`@rules/core/general.mdc`',
    '',
    '## Rules index (router)',
    '',
    '- `@rules/core/boundaries.mdc`',
  ].join('\n')

  const result = verifyIndexOnlyOutput(output, { minRefs: 2 })

  assert.deepEqual(result.errors, [
    'Expected at least 2 @rules/ references, got 1',
  ])
})
