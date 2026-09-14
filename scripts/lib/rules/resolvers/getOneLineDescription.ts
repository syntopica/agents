import { MAX_DESCRIPTION_CHARS } from '../constants/MAX_DESCRIPTION_CHARS'
import { extractShortSummaryLine } from '../extractors/extractShortSummaryLine'
import { toOneLine } from '../formatters/toOneLine'
import { truncate } from '../formatters/truncate'

export function getOneLineDescription(
  item: {
    frontmatter?: Record<string, unknown>
    content?: string
    [key: string]: unknown
  },
  { includeShortSummary }: { includeShortSummary?: boolean },
) {
  const fm = item.frontmatter ?? {}

  const fromFrontmatter = toOneLine(
    (fm['description'] ??
      fm['overview'] ??
      fm['title'] ??
      fm['name'] ??
      '') as string,
  )
  const raw = (() => {
    if (!includeShortSummary) return fromFrontmatter

    const fromBody = toOneLine(extractShortSummaryLine(item.content))
    return fromFrontmatter || fromBody
  })()
  const safe = raw || 'No description provided.'
  return truncate(safe, MAX_DESCRIPTION_CHARS)
}
