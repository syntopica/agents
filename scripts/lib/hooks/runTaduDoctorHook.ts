import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HookContextOutput } from './types/HookContextOutput'

/**
 * Run the PostToolUse tadu doctor hook against one tool call and return the
 * context it adds, or null when it stays silent.
 *
 * @param {Record<string, unknown>} payload - Hook input: tool_name, tool_input, cwd.
 * @param {Record<string, string>} env - Extra environment, such as TADU_BIN.
 * @returns {string | null} - Added context, or null when the hook says nothing.
 */
export const runTaduDoctorHook = (
  payload: Record<string, unknown>,
  env: Record<string, string> = {},
): string | null => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const hook = path.join(repoRoot, 'src/hooks/tadu-doctor-after-edit.sh')

  const raw = execFileSync('bash', [hook], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  }).trim()

  if (raw === '') return null
  const parsed = JSON.parse(raw) as HookContextOutput
  return parsed.hookSpecificOutput?.additionalContext ?? null
}
