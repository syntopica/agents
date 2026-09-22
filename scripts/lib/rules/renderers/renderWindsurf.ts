import { WINDSURF_HEADER_INTRO } from '../constants/WINDSURF_HEADER_INTRO'
import { WINDSURF_MAX_CHARS } from '../constants/WINDSURF_MAX_CHARS'
import { getPriority } from '../resolvers/getPriority'
import type { RuleItem } from '../types/RuleItem'
import { renderIndexOnly } from './renderIndexOnly'

/**
 * Render bundle as WINDSURF.md (index-only with optional priority badges).
 *
 * @param {Array<{ rel: string, frontmatter: object, content: string }>} bundle - From generateBundle
 * @returns {string} - Rendered WINDSURF.md content
 */

export function renderWindsurf(bundle: RuleItem[]) {
  const atomicRule = bundle.find(
    (item) => item.rel === 'core/atomic-file-rule.mdc',
  )
  return renderIndexOnly(bundle, {
    format: 'claude',
    title: '# WINDSURF.md',
    headerIntro: WINDSURF_HEADER_INTRO,

    ...(atomicRule?.content ? { embedContent: atomicRule.content } : {}),
    maxChars: WINDSURF_MAX_CHARS,
    includeShortSummary: true,
    referencePrefix: '@rules/',
    onLimit: 'error',

    getRuleBadges: (item) => [`Priority: ${getPriority(item)}`],
  })
}
