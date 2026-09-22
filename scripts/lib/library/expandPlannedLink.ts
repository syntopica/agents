import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { PlannedLink } from './types/PlannedLink'

export const expandPlannedLink = async (
  link: PlannedLink,
): Promise<PlannedLink[]> => {
  const isSkill = await fs
    .access(join(link.target, 'SKILL.md'))
    .then(() => true)
    .catch(() => false)

  if (isSkill) {
    return [link]
  }

  let children: string[]
  try {
    const entries = await fs.readdir(link.target, { withFileTypes: true })
    children = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return [link]
  }

  const expanded: PlannedLink[] = []

  for (const child of children) {
    const target = join(link.target, child)
    const childIsSkill = await fs
      .access(join(target, 'SKILL.md'))
      .then(() => true)
      .catch(() => false)

    if (childIsSkill) {
      const entryKey = `${link.entryKey}/${child}`
      expanded.push({ name: child, target, entryKey, logicalName: entryKey })
    }
  }

  return expanded.length > 0 ? expanded : [link]
}
