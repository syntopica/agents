import path from 'node:path'

/**
 * A skill's path relative to the root it came from.
 *
 * The compiled layout mirrors the source layout, so the relative path decides
 * where a skill lands in `dist`. With one root that was `path.relative` against
 * a constant; with a private second root it has to be measured against the root
 * that actually owns the directory, or an instance skill compiles to a path
 * full of `..` and escapes `dist/skills` entirely.
 */
export const toSkillSourceRelativePath = (
  roots: string[],
  sourceDir: string,
): string => {
  const owner = roots.find((root) => {
    const relative = path.relative(root, sourceDir)

    return (
      relative !== '' &&
      !relative.startsWith('..') &&
      !path.isAbsolute(relative)
    )
  })

  if (owner === undefined) {
    throw new Error(
      `Skill directory belongs to no configured root: ${sourceDir}`,
    )
  }

  return path.relative(owner, sourceDir)
}
