import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Run the UserPromptSubmit router hook against a prompt and return the directive
 * it injects, or null when it stays silent.
 *
 * Spawns the real script rather than importing the matcher, so the test covers
 * the artifact that actually ships.
 *
 * @param {string} prompt - The user prompt to route.
 * @param {string} [sessionId] - Session id for per-session lane idempotency;
 *   omitted in most tests so every call routes statelessly.
 * @returns {string | null} - Injected additionalContext, or null if silent.
 */
export const runRouterHook = (
  prompt: string,
  sessionId?: string,
): string | null => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const hook = path.join(repoRoot, 'src/hooks/user-prompt-skill-router.sh')

  const raw = execFileSync('bash', [hook], {
    input: JSON.stringify(
      sessionId ? { prompt, session_id: sessionId } : { prompt },
    ),
    encoding: 'utf8',
  }).trim()

  if (raw === '') return null

  const parsed = JSON.parse(raw) as {
    hookSpecificOutput?: { hookEventName?: string; additionalContext?: string }
  }
  if (parsed.hookSpecificOutput?.hookEventName !== 'UserPromptSubmit') {
    throw new Error(`unexpected hookEventName in router output: ${raw}`)
  }
  return parsed.hookSpecificOutput.additionalContext ?? null
}
