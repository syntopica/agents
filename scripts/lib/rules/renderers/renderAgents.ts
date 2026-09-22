import { AGENTS_HEADER_INTRO } from '../constants/AGENTS_HEADER_INTRO'
import { AGENTS_MAX_CHARS } from '../constants/AGENTS_MAX_CHARS'
import type { RuleItem } from '../types/RuleItem'
import { renderIndexOnly } from './renderIndexOnly'

/**
 * Render bundle as AGENTS.md (index-only: references only, no rule bodies).
 *
 * @param {Array<{ rel: string, frontmatter: object, content: string }>} bundle - From generateBundle
 * @returns {string} - Rendered AGENTS.md content
 */

export function renderAgents(bundle: RuleItem[]) {
  const atomicRule = bundle.find(
    (item) => item.rel === 'core/atomic-file-rule.mdc',
  )
  return renderIndexOnly(bundle, {
    format: 'claude',
    title: '# AGENTS.md',
    headerIntro: AGENTS_HEADER_INTRO,

    ...(atomicRule?.content ? { embedContent: atomicRule.content } : {}),
    maxChars: AGENTS_MAX_CHARS,
    includeShortSummary: true,
    referencePrefix: '@rules/',
    onLimit: 'error',
  })
}
