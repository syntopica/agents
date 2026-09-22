import { AGENTS_PATH } from '../constants/AGENTS_PATH'
import { CLAUDE_PATH } from '../constants/CLAUDE_PATH'
import { GEMINI_PATH } from '../constants/GEMINI_PATH'
import { WINDSURF_PATH } from '../constants/WINDSURF_PATH'
import { readIfExists } from '../lib/fs/operations/readIfExists'
import { COMPILE_RULES_LIMITS } from './constants/COMPILE_RULES_LIMITS'
import { verifyClaudeGoldenMaster } from './verifyClaudeGoldenMaster'
import { verifyIndexOnlyOutput } from './verifyIndexOnlyOutput'

export async function main() {
  const goldenOnly = process.argv.includes('--golden-only')
  const skipGolden = process.argv.includes('--skip-golden')
  if (!skipGolden) {
    const golden = await verifyClaudeGoldenMaster()
    if (!golden.ok) {
      console.error('[verify] Golden master check failed:', golden.error)
      process.exit(1)
    }
    console.log('[verify] CLAUDE.md golden master OK')
    if (goldenOnly) return
  }

  for (const [name, filePath, maxChars] of [
    ['CLAUDE.md', CLAUDE_PATH, COMPILE_RULES_LIMITS.CLAUDE_MAX_CHARS],
    ['AGENTS.md', AGENTS_PATH, 50_000],
    ['GEMINI.md', GEMINI_PATH, 50_000],
    ['WINDSURF.md', WINDSURF_PATH, 50_000],
  ] as [string, string, number][]) {
    const content = await readIfExists(filePath)

    if (content?.includes('## Rules index (router)')) {
      const result = verifyIndexOnlyOutput(content, {
        maxChars,
        minRefs: 40,
        ...(name === 'GEMINI.md'
          ? {
              refPattern: /@\.agent\/(?:rules|workflows)\/[^\s`]+/g,
              refLabel: '@.agent/',
            }
          : {}),
      })
      if (!result.ok) {
        console.error(`[verify] DoD check failed for ${name}:`)
        result.errors.forEach((e: unknown) => {
          console.error('  -', e)
        })
        process.exit(1)
      }
      console.log(`[verify] ${name} DoD OK`)
    }
  }

  console.log('[verify] All checks passed.')
}
