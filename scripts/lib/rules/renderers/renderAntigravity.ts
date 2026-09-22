import { GEMINI_HEADER_INTRO } from '../constants/GEMINI_HEADER_INTRO'
import { GEMINI_MAX_CHARS } from '../constants/GEMINI_MAX_CHARS'
import { getActivation } from '../resolvers/getActivation'
import { getAntigravityReference } from '../resolvers/getAntigravityReference'
import type { RuleItem } from '../types/RuleItem'
import { renderIndexOnly } from './renderIndexOnly'

/**
 * Render bundle as GEMINI.md (index-only with optional activation badges).
 *
 * @param {Array<{ rel: string, frontmatter: object, content: string }>} bundle - From generateBundle
 * @returns {string} - Rendered GEMINI.md content
 */

export function renderAntigravity(bundle: RuleItem[]) {
  const atomicRule = bundle.find(
    (item) => item.rel === 'core/atomic-file-rule.mdc',
  )
  return renderIndexOnly(bundle, {
    format: 'claude',
    title: '# GEMINI.md',
    headerIntro: GEMINI_HEADER_INTRO,

    ...(atomicRule?.content ? { embedContent: atomicRule.content } : {}),
    maxChars: GEMINI_MAX_CHARS,
    includeShortSummary: true,
    getRuleRef: getAntigravityReference,
    onLimit: 'error',

    getRuleBadges: (item) => [getActivation(item)],
  }).replace(/(?<!\w)@(?!\.agent\/(?:rules|workflows)\/)/g, '')
}
