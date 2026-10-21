import { promises as fs } from 'node:fs'
import path from 'node:path'
import { collectCodexSkillTrimFiles } from './collectCodexSkillTrimFiles'
import type { CollectCodexSkillTrimPathsInput } from './types/CollectCodexSkillTrimPathsInput'

/**
 * Lists every `SKILL.md` under `skillsDir` that no entry in `curatedDir` points
 * at, which is the set Codex should not spend its context budget on.
 *
 * The curated set is read from the link destination rather than from a second
 * list, so the trim cannot drift from what was actually linked: whatever is
 * offered to Claude keeps its description in Codex too.
 * Unreadable inputs or broken curated links abort instead of treating an
 * unknown selection as an empty selection that would disable every skill.
 */
export const collectCodexSkillTrimPaths = async ({
  skillsDir,
  curatedDir,
}: CollectCodexSkillTrimPathsInput) => {
  const curated = new Set<string>()
  for (const entry of await fs.readdir(curatedDir)) {
    curated.add(await fs.realpath(path.join(curatedDir, entry)))
  }

  const disabled: string[] = []
  for (const file of await collectCodexSkillTrimFiles(skillsDir)) {
    const owner = await fs.realpath(path.dirname(file))
    if (!curated.has(owner)) disabled.push(file)
  }

  return disabled
}
