import { join } from 'node:path'

export const resolveSkillPath = (skillsRoot: string, entryKey: string) =>
  join(skillsRoot, ...entryKey.split('/'))
