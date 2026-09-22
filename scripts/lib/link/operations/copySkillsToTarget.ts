import { promises as fs } from 'node:fs'
import path from 'node:path'
import { cleanGlobalPrefix } from './cleanGlobalPrefix'

export const copySkillsToTarget = async ({
  sourceDir,
  targetDir,
  skillNames,
  prefix,
  flatten = false,
}: {
  sourceDir: string
  targetDir: string
  skillNames: string[]
  prefix: string
  flatten?: boolean
}) => {
  await fs.mkdir(targetDir, { recursive: true })

  const cleaned = await cleanGlobalPrefix(targetDir, prefix)

  const copied = []

  for (const skillName of skillNames) {
    const source = `${sourceDir}/${skillName}`
    const targetName = flatten ? path.basename(skillName) : skillName
    const target = `${targetDir}/${targetName}`

    await fs.rm(target, { recursive: true, force: true })
    await fs.cp(source, target, { recursive: true, dereference: true })

    copied.push(skillName)
  }

  return { cleaned, copied }
}
