import { promises as fs } from 'node:fs'
import { CODEX_SECTION_PATTERN } from './constants/CODEX_SECTION_PATTERN'
import { parseTomlServerSections } from './parseTomlServerSections'

export const readCodexServers = async (configPath: string) => {
  try {
    const contents = await fs.readFile(configPath, 'utf8')
    return parseTomlServerSections(contents, CODEX_SECTION_PATTERN)
  } catch {
    return {}
  }
}
