import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RunContextSizeGuardParsed } from './types/RunContextSizeGuardParsed'

/**
 * Run the UserPromptSubmit context-size guard against one transcript and return
 * what it emits, or null when it stays silent.
 *
 * @param {string} transcriptPath - Transcript file the hook payload points at.
 * @param {string} threshold - Value for CONTEXT_GUARD_TOKENS.
 * @returns {RunContextSizeGuardParsed | null} - Hook output, or null when silent.
 */
export const runContextSizeGuard = (
  transcriptPath: string,
  threshold = '150000',
): RunContextSizeGuardParsed | null => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const hook = path.join(repoRoot, 'src/hooks/context-size-guard.sh')

  const raw = execFileSync('bash', [hook], {
    input: JSON.stringify({ transcript_path: transcriptPath, prompt: 'x' }),
    encoding: 'utf8',
    env: { ...process.env, CONTEXT_GUARD_TOKENS: threshold },
  }).trim()

  if (raw === '') return null
  return JSON.parse(raw) as RunContextSizeGuardParsed
}
