import { promises as fs } from 'node:fs'

export const loadSkillRulesManifest = async (
  filePath: string,
): Promise<unknown> => {
  const raw = await fs.readFile(filePath, 'utf8')

  return JSON.parse(raw) as unknown
}
