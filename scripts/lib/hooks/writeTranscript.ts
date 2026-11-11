import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Write transcript entries as JSONL to a fresh temporary file.
 *
 * @param {unknown[]} entries - Transcript entries, one per line.
 * @returns {string} - Path of the written transcript.
 */
export const writeTranscript = (entries: unknown[]): string => {
  const file = path.join(
    mkdtempSync(path.join(tmpdir(), 'ctx-guard-')),
    't.jsonl',
  )
  writeFileSync(file, entries.map((entry) => JSON.stringify(entry)).join('\n'))
  return file
}
