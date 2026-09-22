import { normalizeLineEndings } from '../converters/normalizeLineEndings'
import { normalizeRel } from '../converters/normalizeRel'
import { groupByCategoryAndSubcategory } from '../groupers/groupByCategoryAndSubcategory'
import { renderGrouped } from './renderGrouped'

/**
 * ALL_RULES.md renderer.
 * Emits every rule with full content, grouped by category and subcategory.
 *
 * @param {Array<{ rel: string, frontmatter?: unknown, content?: string }>} bundle
 * @returns {string}
 */

import type { RuleItem } from '../types/RuleItem'

export function renderAllRules(bundle: RuleItem[]) {
  const items = bundle

    .map((item) => ({
      rel: normalizeRel(item.rel),

      content: normalizeLineEndings(item.content ?? ''),
    }))

    .filter((i) => i.rel.endsWith('.mdc'))

    .sort((a, b) => a.rel.localeCompare(b.rel))
  const grouped = groupByCategoryAndSubcategory(items)
  const header = [
    '# ALL_RULES.md',
    '',
    'This file contains the full text of every rule, grouped by category and subcategory.',
    '',
  ].join('\n')
  const body = renderGrouped(grouped)
  return `${header}${body}`
}
