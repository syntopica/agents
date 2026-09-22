import type { PlannedLink } from './types/PlannedLink'

export const deduplicatePlannedLinks = (
  links: PlannedLink[],
): PlannedLink[] => {
  const seen = new Set<string>()

  return links.filter((link) => {
    const identity = [
      link.name,
      link.target,
      link.entryKey,
      link.logicalName,
    ].join('\u0000')
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}
