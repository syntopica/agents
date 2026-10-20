import { promises as fs } from 'node:fs'
import { copyDirWithTransform } from './copyDirWithTransform'
import type { CopySkillToTargetWithTransformInput } from './types/CopySkillToTargetWithTransformInput'

export const copySkillToTargetWithTransform = async ({
  source,
  target,
  transformContent,
}: CopySkillToTargetWithTransformInput): Promise<void> => {
  await fs.rm(target, { recursive: true, force: true })
  await fs.mkdir(target, { recursive: true })
  await copyDirWithTransform(source, target, source, transformContent)
}
