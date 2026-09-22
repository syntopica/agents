import { readFile } from 'node:fs/promises'
import type { ClaudeSettingsPaths } from './types/ClaudeSettingsPaths'

export const readClaudeSettings = async (paths: ClaudeSettingsPaths) => {
  const readProfile = async (
    path: string,
  ): Promise<Record<string, unknown>> => {
    try {
      const contents = await readFile(path, 'utf8')
      return contents.trim() === ''
        ? {}
        : (JSON.parse(contents) as Record<string, unknown>)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
      throw error
    }
  }

  return {
    'claude-personal': await readProfile(paths['claude-personal']),
    'claude-secondary': await readProfile(paths['claude-secondary']),
  }
}
