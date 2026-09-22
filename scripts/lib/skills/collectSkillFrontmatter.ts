import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { INSTANCE_SKILLS_DIR } from '../../constants/INSTANCE_SKILLS_DIR'

/**
 * Read every SKILL.md under the configured skill roots and return its
 * frontmatter block. Private skills are held to the same description standard
 * as shipped ones; a root that is declared and missing is skipped rather than
 * thrown, because this runs in a test that must not depend on one machine.
 *
 * @returns {{ name: string; frontmatter: string }[]} - One entry per skill, named
 *   by its containing directory. Files without a frontmatter fence yield "".
 */
export const collectSkillFrontmatter = (): {
  name: string
  frontmatter: string
}[] => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const skillsDir = path.join(repoRoot, 'src/skills')

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) return walk(full)
      return entry === 'SKILL.md' ? [full] : []
    })

  const roots = [skillsDir, INSTANCE_SKILLS_DIR].filter(
    (root): root is string => root !== undefined && existsSync(root),
  )

  return roots.flatMap(walk).map((file) => ({
    name: path.basename(path.dirname(file)),
    frontmatter:
      /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, 'utf8'))?.[1] ?? '',
  }))
}
