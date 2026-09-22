import type { CurationEntry } from './types/CurationEntry'

export const deriveNestedEntry = (
  parent: CurationEntry,
): Partial<CurationEntry> => ({
  ...(parent.source === undefined ? {} : { source: parent.source }),
  ...(parent.sourceUrl === undefined ? {} : { sourceUrl: parent.sourceUrl }),
  ...(parent.upstreamHash === undefined
    ? {}
    : { upstreamHash: parent.upstreamHash }),
  ...(parent.licence === undefined ? {} : { licence: parent.licence }),
})
