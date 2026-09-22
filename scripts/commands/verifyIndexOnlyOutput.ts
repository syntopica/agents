import { DEFAULT_MAX_CHARS } from '../constants/DEFAULT_MAX_CHARS'
import { DEFAULT_MIN_REFS } from '../constants/DEFAULT_MIN_REFS'

/**
 * DoD checks on index-only output string.
 *
 * Reference counting is scoped to the router index, because AGENTS.md inlines
 * whole rule bodies above it and a rule that cross-references another rule file
 * would otherwise read as a duplicate index entry.
 *
 * @param {string} output
 * @param {{ maxChars?: number, minRefs?: number, refPattern?: RegExp, refLabel?: string }} options
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function verifyIndexOnlyOutput(
  output: string,
  options: {
    maxChars?: number
    minRefs?: number
    refPattern?: RegExp
    refLabel?: string
  } = {},
) {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS
  const minRefs = options.minRefs ?? DEFAULT_MIN_REFS
  const refPattern = options.refPattern ?? /@rules\/[^\s`]+/g
  const refLabel = options.refLabel ?? '@rules/'
  const errors = []
  if (typeof output !== 'string') {
    return { ok: false, errors: ['Output is not a string'] }
  }

  if (output.includes('```mdc')) {
    errors.push('Output must not contain inline mdc blocks (no "```mdc")')
  }

  const indexStart = output.indexOf('## Rules index (router)')
  if (indexStart === -1) {
    errors.push('Output must include "## Rules index (router)"')
  }

  const refMatches = output.slice(Math.max(indexStart, 0)).match(refPattern)
  const refs = refMatches ? [...new Set(refMatches)] : []
  if (refs.length < minRefs) {
    errors.push(
      `Expected at least ${String(minRefs)} ${refLabel} references, got ${String(refs.length)}`,
    )
  }

  const duplicates = refMatches && refMatches.length !== refs.length
  if (duplicates) {
    errors.push(`Duplicate ${refLabel} references found`)
  }

  if (output.length > maxChars) {
    errors.push(
      `Output length ${String(output.length)} exceeds maxChars ${String(maxChars)}`,
    )
  }

  return { ok: errors.length === 0, errors }
}
