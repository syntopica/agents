import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const listSkillPaths = async (libraryDir: string) => {
  const root = join(libraryDir, 'skills')
  const paths: string[] = []

  let bundles: string[]
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    bundles = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return paths
  }

  for (const bundle of bundles) {
    const isSkill = await fs
      .access(join(root, bundle, 'SKILL.md'))
      .then(() => true)
      .catch(() => false)

    if (isSkill) {
      paths.push(bundle)
      continue
    }

    let children: string[]
    try {
      const entries = await fs.readdir(join(root, bundle), {
        withFileTypes: true,
      })
      children = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    } catch {
      continue
    }

    for (const child of children) {
      const childIsSkill = await fs
        .access(join(root, bundle, child, 'SKILL.md'))
        .then(() => true)
        .catch(() => false)

      if (childIsSkill) {
        paths.push(`${bundle}/${child}`)
      }
    }
  }

  return paths
}
