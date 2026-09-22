import { promises as fs } from 'node:fs'
import path from 'node:path'
import { CANONICAL_SKILLS_DIR } from '../constants/CANONICAL_SKILLS_DIR'
import { CLAUDE_HOME } from '../constants/CLAUDE_HOME'
import { CODEX_HOME } from '../constants/CODEX_HOME'
import { applyCodexSkillTrim } from './applyCodexSkillTrim'
import { collectCodexSkillTrimPaths } from './collectCodexSkillTrimPaths'
import { renderCodexSkillTrim } from './renderCodexSkillTrim'

/**
 * Keeps Codex's generated skills trim in step with what was just linked.
 *
 * Writes nothing when Codex is not installed, and nothing when the rendered
 * block already matches, so a repeated link leaves the file and its mtime
 * alone. The previous file is backed up before any change: this is the user's
 * own configuration, and everything outside the markers is theirs.
 */
export const writeCodexSkillTrim = async () => {
  const configPath = path.join(CODEX_HOME, 'config.toml')
  const config = await fs.readFile(configPath, 'utf8').catch(() => undefined)
  if (config === undefined) return { written: false, disabled: 0 }

  const disabled = await collectCodexSkillTrimPaths({
    skillsDir: CANONICAL_SKILLS_DIR,
    curatedDir: path.join(CLAUDE_HOME, 'skills'),
  })
  const updated = applyCodexSkillTrim(config, renderCodexSkillTrim(disabled))
  if (updated === config) return { written: false, disabled: disabled.length }

  const stamp = new Date().toISOString().replace(/[:.]/gu, '-')
  await fs.copyFile(configPath, `${configPath}.backup-${stamp}`)
  await fs.writeFile(configPath, updated)
  return { written: true, disabled: disabled.length }
}
