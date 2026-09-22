import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Run the PreToolUse paused-job guard against one Bash tool call and return the
 * context it adds, or null when it stays silent.
 *
 * Silence is most of the hook's behaviour, so the tests need it as a value
 * rather than as an absence of output to inspect.
 *
 * @param {string} command - Bash command the tool call would run.
 * @param {string} toolName - Tool the call targets; anything but Bash is ignored.
 * @returns {string | null} - Added context, or null when the hook says nothing.
 */
export const runPausedJobGuard = (
  command: string,
  toolName = 'Bash',
): string | null => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const hook = path.join(repoRoot, 'src/hooks/paused-job-guard.sh')

  const raw = execFileSync('bash', [hook], {
    input: JSON.stringify({
      tool_name: toolName,
      tool_input: { command },
    }),
    encoding: 'utf8',
  }).trim()

  if (raw === '') return null
  const parsed = JSON.parse(raw) as {
    hookSpecificOutput?: { additionalContext?: string }
  }
  return parsed.hookSpecificOutput?.additionalContext ?? null
}
