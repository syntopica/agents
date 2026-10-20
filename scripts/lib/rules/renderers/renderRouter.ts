import type { RuleItem } from '../types/RuleItem'
import type { RenderRouterInput } from './types/RenderRouterInput'

export function renderRouter(
  groups: Record<string, RuleItem[]>,
  { getRuleRef, getRuleBadges, getOneLineDesc }: RenderRouterInput,
) {
  const segments = Object.keys(groups).sort((a: string, b: string) => {
    if (a === 'entrypoints') return -1
    if (b === 'entrypoints') return 1
    return a.localeCompare(b)
  })
  const lines = [
    '## Rules index (router)',
    '',
    'Each entry points to the source rule file. Content is intentionally not inlined here.',
    '',
    '### Sections',
    '',
    segments.join(' · '),
    '',
  ]
  for (const seg of segments) {
    lines.push(
      seg === 'entrypoints' ? '### entrypoints (start here)' : `### ${seg}`,
    )
    lines.push('')

    for (const item of groups[seg] ?? []) {
      const ref = getRuleRef(item)

      const description = getOneLineDesc(item)

      const primary = `- \`${ref}\` — ${description}`
      lines.push(primary)

      const badges = getRuleBadges(item)

      if (badges.length > 0) {
        lines.push(`  (${badges.join(', ')})`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}
