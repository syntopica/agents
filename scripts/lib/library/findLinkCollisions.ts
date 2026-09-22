import type { PlannedLink } from './types/PlannedLink'

export const findLinkCollisions = (links: PlannedLink[]) => {
  const seen = new Map<string, string>()
  const collisions: string[] = []

  for (const link of links) {
    const previous = seen.get(link.name)

    if (previous === undefined) {
      seen.set(link.name, link.entryKey)
      continue
    }

    collisions.push(
      `${link.name} is claimed by both ${previous} and ${link.entryKey}`,
    )
  }

  return collisions
}
