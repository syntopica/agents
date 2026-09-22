import { CLAUDE_PATH } from '../constants/CLAUDE_PATH'
import { SOURCE_DIR } from '../constants/SOURCE_DIR'
import { listFilesRecursive } from '../lib/fs/operations/listFilesRecursive'
import { readIfExists } from '../lib/fs/operations/readIfExists'
import { generateBundle } from '../lib/rules/generators/generateBundle'
import { renderClaudeIndexOnly } from '../lib/rules/renderers/renderClaudeIndexOnly'
import { COMPILE_RULES_LIMITS } from './constants/COMPILE_RULES_LIMITS'

/**
 * Assert CLAUDE.md on disk is byte-identical to freshly generated output (golden master).
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function verifyClaudeGoldenMaster() {
  try {
    const sourceFiles = await listFilesRecursive(SOURCE_DIR)

    const bundle = await generateBundle(sourceFiles, SOURCE_DIR)
    const generated = renderClaudeIndexOnly(bundle, {
      maxChars: COMPILE_RULES_LIMITS.CLAUDE_MAX_CHARS,
      includeShortSummary: false,
    })
    const onDisk = await readIfExists(CLAUDE_PATH)
    if (onDisk === null) {
      return {
        ok: false,
        error: 'CLAUDE.md not found (run pnpm rules:compile first)',
      }
    }
    if (onDisk !== generated) {
      return {
        ok: false,
        error:
          'CLAUDE.md is not byte-identical to generated output (golden master mismatch)',
      }
    }
    return { ok: true }
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
