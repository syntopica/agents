import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * Lists every `SKILL.md` under `skillsDir` that no entry in `curatedDir` points
 * at, which is the set Codex should not spend its context budget on.
 *
 * The curated set is read from the link destination rather than from a second
 * list, so the trim cannot drift from what was actually linked: whatever is
 * offered to Claude keeps its description in Codex too.
 */
export const collectCodexSkillTrimPaths = async ({
  skillsDir,
  curatedDir,
}: {
  skillsDir: string
  curatedDir: string
}) => {
  const curated = new Set<string>()
  for (const entry of await fs.readdir(curatedDir).catch(() => [])) {
    const resolved = await fs
      .realpath(path.join(curatedDir, entry))
      .catch(() => undefined)
    if (resolved !== undefined) curated.add(resolved)
  }

  const disabled: string[] = []
  const walk = async (directory: string) => {
    for (const entry of await fs
      .readdir(directory, { withFileTypes: true })
      .catch(() => [])) {
      const child = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(child)
        continue
      }
      if (entry.name !== 'SKILL.md') continue
      const owner = await fs.realpath(directory).catch(() => directory)
      if (!curated.has(owner)) disabled.push(child)
    }
  }
  await walk(skillsDir)

  return disabled
}
