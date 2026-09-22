import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Run the Stop verification gate against a working directory and return the
 * block reason, or null when it stays silent.
 *
 * The caller decides whether an edit happened by what it writes into
 * transcript.jsonl inside cwd; this function only reports what the gate said.
 *
 * @param {string} cwd - Project directory the gate should inspect, containing transcript.jsonl.
 * @returns {string | null} - Reason the gate blocks on, or null when it allows the stop.
 */
export const runStopGate = (cwd: string): string | null => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const hook = path.join(repoRoot, 'src/hooks/stop-verification-gate.sh')
  const transcript = path.join(cwd, 'transcript.jsonl')

  const raw = execFileSync('bash', [hook], {
    input: JSON.stringify({
      cwd,
      transcript_path: transcript,
      stop_hook_active: 'False',
    }),
    encoding: 'utf8',
  }).trim()

  if (raw === '') return null
  const parsed = JSON.parse(raw) as { decision?: string; reason?: string }
  return parsed.decision === 'block' ? (parsed.reason ?? '') : null
}
