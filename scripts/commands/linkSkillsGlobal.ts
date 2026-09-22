import path from 'node:path'
import { CODEX_AGENTS_DIST_DIR } from '../constants/CODEX_AGENTS_DIST_DIR'
import { SRC_AGENTS_DIR } from '../constants/SRC_AGENTS_DIR'
import { CANONICAL_SKILLS_DIR } from '../lib/link/constants/CANONICAL_SKILLS_DIR'
import { CANONICAL_SKILLS_PORTABLE_DIR } from '../lib/link/constants/CANONICAL_SKILLS_PORTABLE_DIR'
import { CLAUDE_HOME } from '../lib/link/constants/CLAUDE_HOME'
import { CODEX_HOME } from '../lib/link/constants/CODEX_HOME'
import { IDE_REGISTRY } from '../lib/link/constants/IDE_REGISTRY'
import { linkAgentsToClaude } from '../lib/link/operations/linkAgentsToClaude'
import { linkAgentsToCodex } from '../lib/link/operations/linkAgentsToCodex'
import { writeCodexSkillTrim } from '../lib/link/operations/writeCodexSkillTrim'
import { SKILLS_DIST_DIR } from './constants/SKILLS_DIST_DIR'
import { SKILLS_PORTABLE_DIST_DIR } from './constants/SKILLS_PORTABLE_DIST_DIR'
import { collectSkillNames } from './processors/collectSkillNames'
import { populateCanonicalSkillsDir } from './processors/populateCanonicalSkillsDir'
import { processTarget } from './processors/processTarget'

export const main = async () => {
  const claudeSkillNames = await collectSkillNames(SKILLS_DIST_DIR)
  if (claudeSkillNames.length === 0) {
    console.log('No skills found in dist/skills/.')
    return
  }
  const portableSkillNames = await collectSkillNames(SKILLS_PORTABLE_DIST_DIR)

  await populateCanonicalSkillsDir({
    source: SKILLS_DIST_DIR,
    target: CANONICAL_SKILLS_DIR,
    skillNames: claudeSkillNames,
  })
  await populateCanonicalSkillsDir({
    source: SKILLS_PORTABLE_DIST_DIR,
    target: CANONICAL_SKILLS_PORTABLE_DIR,
    skillNames: portableSkillNames,
  })

  let linked = 0
  let skipped = 0

  for (const target of IDE_REGISTRY) {
    const bundle = target.skillsBundle ?? 'portable'
    const skillNames =
      bundle === 'claude' ? claudeSkillNames : portableSkillNames
    const wasLinked = await processTarget(target, skillNames)
    if (wasLinked) {
      linked++
    } else {
      skipped++
    }
  }

  const linkedAgents = await linkAgentsToClaude({
    srcAgentsDir: SRC_AGENTS_DIR,
    targetAgentsDir: path.join(CLAUDE_HOME, 'agents'),
  })
  if (linkedAgents.length > 0) {
    console.log(
      `+ claude: ${String(linkedAgents.length)} subagents linked into ~/.claude/agents/`,
    )
  }

  const linkedCodexAgents = await linkAgentsToCodex({
    compiledAgentsDir: CODEX_AGENTS_DIST_DIR,
    targetAgentsDir: path.join(CODEX_HOME, 'agents'),
  })
  if (linkedCodexAgents.length > 0) {
    console.log(
      `+ codex: ${String(linkedCodexAgents.length)} custom agents linked into ~/.codex/agents/`,
    )
  }

  const trim = await writeCodexSkillTrim()
  if (trim.written) {
    console.log(
      `+ codex: ${String(trim.disabled)} non-curated skills disabled in ~/.codex/config.toml`,
    )
  }

  console.log(
    `\nDone: ${String(claudeSkillNames.length)} skills -> canonical product directories + ${String(linked)} IDE targets` +
      (skipped > 0 ? ` (${String(skipped)} skipped)` : ''),
  )
}
