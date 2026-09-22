import { normalizeRel } from '../converters/normalizeRel'
import { groupByTopSegment } from '../groupers/groupByTopSegment'
import { defaultGetRuleRef } from '../resolvers/defaultGetRuleRef'
import { getOneLineDescription } from '../resolvers/getOneLineDescription'
import type { RenderIndexOnlyOptions } from '../types/RenderIndexOnlyOptions'
import type { RuleItem } from '../types/RuleItem'
import { renderRouter } from './renderRouter'

/**
 * Generic index-only renderer engine. Emits only rule references (path + short description).
 * No rule bodies. No IDE-specific logic; wrappers (skins) pass options/callbacks.
 *
 * @param {Array<{ rel: string, frontmatter: object, content: string }>} bundle
 * @param {RenderIndexOnlyOptions} options
 * @returns {string}
 */

export function renderIndexOnly(
  bundle: RuleItem[],
  options: RenderIndexOnlyOptions = {},
) {
  // The default mirrors COMPILE_RULES_LIMITS.CLAUDE_MAX_CHARS rather than
  // importing it, because this renderer is the leaf every caller passes an
  // explicit budget to. Two literals of the same budget in two files is how the
  // golden-master verifier kept enforcing 15,000 after the compiler moved to
  // 15,500 — a caller that forgets to pass one should fail conservatively, not
  // silently at a different number than the one on the tin.
  const maxChars =
    typeof options.maxChars === 'number' ? options.maxChars : 15_000

  const onLimit = options.onLimit === 'truncate' ? 'truncate' : 'error'

  const includeShortSummary = options.includeShortSummary === true

  const referencePrefix = options.referencePrefix ?? '@rules/'

  const title = options.title ?? '# Index'

  const headerIntro = options.headerIntro ?? ''

  const embedContent = options.embedContent ?? ''

  const getRuleRef =
    typeof options.getRuleRef === 'function'
      ? options.getRuleRef
      : defaultGetRuleRef(referencePrefix)

  const getRuleBadges =
    typeof options.getRuleBadges === 'function'
      ? options.getRuleBadges
      : () => []
  const attempt = (withShortSummary: boolean) => {
    const items = bundle

      .map((item: RuleItem) => ({
        rel: normalizeRel(item.rel),

        frontmatter: item.frontmatter ?? {},

        content: item.content ?? '',
      }))

      .filter((i: RuleItem) => i.rel.endsWith('.mdc'))

      .sort((a: RuleItem, b: RuleItem) => a.rel.localeCompare(b.rel))

    const groups = groupByTopSegment(items)
    const header = [title, '', headerIntro].join('\n').trimEnd()

    const embedded = embedContent
      ? `\n\n---\n\n${embedContent.trim()}\n\n---`
      : ''
    const router = renderRouter(groups, {
      getRuleRef,

      getRuleBadges,
      getOneLineDesc: (item: RuleItem) =>
        getOneLineDescription(item, { includeShortSummary: withShortSummary }),
    })
    return `${header}${embedded}\n\n${router}\n`
  }
  const primary = attempt(includeShortSummary)
  if (primary.length <= maxChars) return primary
  if (includeShortSummary) {
    const downgraded = attempt(false)
    if (downgraded.length <= maxChars) return downgraded
  }

  if (onLimit === 'truncate') {
    return primary.slice(0, maxChars)
  }

  throw new Error(
    `Index exceeded size budget: ${String(primary.length)} > ${String(maxChars)} chars. ` +
      'Reduce descriptions/summaries or increase maxChars.',
  )
}
