import assert from 'node:assert/strict'
import test from 'node:test'
import { descriptionBoundaryErrors } from '../../validators/descriptionBoundaryErrors'
import { descriptionSpecificityWarning } from '../../validators/descriptionSpecificityWarning'
import { descriptionTriggerPositionError } from '../../validators/descriptionTriggerPositionError'
import { frontmatterDescriptionErrors } from '../../validators/frontmatterDescriptionErrors'
import { collectSkillFrontmatter } from './collectSkillFrontmatter'
import { extractDescription } from './extractDescription'

/**
 * Runs the description validators that existed in this repo but had no callers,
 * so a skill whose description cannot be parsed or has no activation boundary
 * fails the build instead of shipping silently.
 */

void test('every skill description parses', () => {
  const failures = collectSkillFrontmatter().flatMap(({ name, frontmatter }) =>
    frontmatterDescriptionErrors(frontmatter).map(
      (error) => `${name}: ${error}`,
    ),
  )
  assert.deepEqual(failures, [], failures.join('\n'))
})

void test('every skill description has activation boundaries', () => {
  const failures = collectSkillFrontmatter().flatMap(({ name, frontmatter }) =>
    descriptionBoundaryErrors(extractDescription(frontmatter)).map(
      (error) => `${name}: ${error}`,
    ),
  )
  assert.deepEqual(failures, [], failures.join('\n'))
})

void test('every skill description opens its activation boundary early', () => {
  const failures = collectSkillFrontmatter()
    .map(({ name, frontmatter }) => ({
      name,
      error: descriptionTriggerPositionError(extractDescription(frontmatter)),
    }))
    .filter(({ error }) => error !== null)
    .map(({ name, error }) => `${name}: ${String(error)}`)
  assert.deepEqual(failures, [], failures.join('\n'))
})

void test('every skill description is specific enough to activate', () => {
  const failures = collectSkillFrontmatter()
    .map(({ name, frontmatter }) => ({
      name,
      warning: descriptionSpecificityWarning(extractDescription(frontmatter)),
    }))
    .filter(({ warning }) => warning !== null)
    .map(({ name, warning }) => `${name}: ${String(warning)}`)
  assert.deepEqual(failures, [], failures.join('\n'))
})
