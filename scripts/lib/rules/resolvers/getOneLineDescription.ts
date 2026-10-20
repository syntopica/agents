import { MAX_DESCRIPTION_CHARS } from '../constants/MAX_DESCRIPTION_CHARS'
import { extractShortSummaryLine } from '../extractors/extractShortSummaryLine'
import { toOneLine } from '../formatters/toOneLine'
import { truncate } from '../formatters/truncate'
import type { GetOneLineDescriptionInput } from './types/GetOneLineDescriptionInput'
import type { GetOneLineDescriptionItem } from './types/GetOneLineDescriptionItem'

export function getOneLineDescription(
  item: GetOneLineDescriptionItem,
  { includeShortSummary }: GetOneLineDescriptionInput,
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
