import { promises as fs } from 'node:fs'
import { copyDirWithTransform } from './copyDirWithTransform'

export const copySkillToTargetWithTransform = async ({
  source,
  target,
  transformContent,
}: {
  source: string
  target: string
  transformContent: (content: string, relativePath: string) => string
}): Promise<void> => {
  await fs.rm(target, { recursive: true, force: true })
  await fs.mkdir(target, { recursive: true })
  await copyDirWithTransform(source, target, source, transformContent)
}
