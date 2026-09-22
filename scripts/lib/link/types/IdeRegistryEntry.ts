export interface IdeRegistryEntry {
  id: string
  rootDir: string | undefined
  detectPaths?: string[]
  skillsDir?: string
  linkStrategy?: 'symlink' | 'copy'
  flattenSkills?: boolean
  skillsBundle?: 'claude' | 'portable'
}
