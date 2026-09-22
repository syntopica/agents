import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Build a throwaway project directory for exercising the Stop gate.
 *
 * @param {Record<string, string>} files - Files to write, keyed by basename.
 * @param {boolean} edited - Whether the transcript should record an edit this session.
 * @param {string} editToolName - Tool name used for an edited transcript.
 * @returns {string} - Path to the created directory.
 */
export const makeStopGateProject = (
  files: Record<string, string>,
  edited: boolean,
  editToolName = 'Edit',
): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'stopgate-'))
  for (const [name, body] of Object.entries(files))
    writeFileSync(path.join(dir, name), body)
  writeFileSync(
    path.join(dir, 'transcript.jsonl'),
    JSON.stringify({ name: edited ? editToolName : 'Read' }),
  )
  return dir
}
