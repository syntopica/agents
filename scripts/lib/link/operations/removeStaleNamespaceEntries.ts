import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathExists } from './pathExists'
import { removeSkillEntry } from './removeSkillEntry'

// Repo skills live under namespace subdirectories of the canonical dir
// (e.g. core/brp-docs). Root-level prefix cleanup never reaches them, so a
// skill removed from the repo would otherwise persist in the namespace
// forever. Only namespaces present in the current skill set are touched;
// root-level entries (externally installed skills) are never removed here.
export const removeStaleNamespaceEntries = async (
  targetDir: string,
  skillNames: string[],
): Promise<string[]> => {
  const current = new Set(skillNames)
  const namespaces = new Set(
    skillNames.map((name) => path.dirname(name)).filter((dir) => dir !== '.'),
  )
  const removed: string[] = []

  for (const namespace of namespaces) {
    const namespaceDir = path.join(targetDir, namespace)
    const exists = await pathExists(namespaceDir)
    if (!exists) {
      continue
    }

    for (const entry of await fs.readdir(namespaceDir)) {
      const skillName = path.join(namespace, entry)
      if (current.has(skillName)) {
        continue
      }

      await removeSkillEntry(path.join(namespaceDir, entry))
      removed.push(skillName)
    }
  }

  return removed
}
