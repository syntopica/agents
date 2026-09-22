import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * The private skills directory's own `skill-rules.map.json`.
 *
 * It is a fragment, not a manifest: it carries entries only for the skills
 * that live beside it. The engine's manifest validates in both directions --
 * every skill needs an entry and every entry needs a directory -- so a
 * private skill cannot be declared in the tracked map without naming it
 * there, and the tracked map cannot name a skill a clone does not have.
 *
 * A directory with no fragment yields no entries rather than failing, because
 * a private skill that needs no rules is a legitimate thing to have.
 */
export const loadInstanceSkillRules = async (
  instanceDir: string,
): Promise<Record<string, { rules?: string[] }>> => {
  const fragmentPath = path.join(instanceDir, 'skill-rules.map.json')

  const raw = await fs.readFile(fragmentPath, 'utf8').catch(() => undefined)
  if (raw === undefined) {
    return {}
  }

  const parsed = JSON.parse(raw) as {
    skills?: Record<string, { rules?: string[] }>
  }

  return parsed.skills ?? {}
}
