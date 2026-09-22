import { listSkillDirs } from './listSkillDirs'

/**
 * Skill directories from every configured root. Missing roots are an error,
 * not an empty list: a private skills directory that has moved must fail
 * loudly, or the machine quietly loses skills it still believes it has.
 */
export const listSkillDirsAcross = async (
  roots: string[],
): Promise<string[]> => {
  const found = await Promise.all(roots.map(listSkillDirs))

  return found.flat()
}
