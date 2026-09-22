import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectSkillCapability = async (
  skillsDir: string | undefined,
): Promise<CapabilityHealth> => {
  if (skillsDir === undefined) {
    return {
      capability: 'skills',
      status: 'unsupported',
      summary: 'no skills adapter',
      findings: [],
    }
  }

  const entries = await fs
    .readdir(skillsDir, { withFileTypes: true })
    .catch(() => undefined)
  if (entries === undefined) {
    return {
      capability: 'skills',
      status: 'failed',
      summary: 'skills directory is missing',
      findings: [skillsDir],
    }
  }

  const broken: string[] = []
  let readable = 0
  for (const entry of entries) {
    const entryPath = join(skillsDir, entry.name)
    if (entry.isSymbolicLink()) {
      const resolves = await fs
        .realpath(entryPath)
        .then(() => true)
        .catch(() => false)
      if (!resolves) {
        broken.push(entry.name)
        continue
      }
    }

    const skillReadable = await fs
      .access(join(entryPath, 'SKILL.md'))
      .then(() => true)
      .catch(() => false)
    if (skillReadable) readable++
  }

  return {
    capability: 'skills',
    status: broken.length === 0 ? 'healthy' : 'degraded',
    summary: `${String(readable)} readable skills, ${String(broken.length)} broken links`,
    findings: broken,
  }
}
