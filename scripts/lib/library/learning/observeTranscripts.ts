import { promises as fs } from 'node:fs'
import { listTranscriptFiles } from './listTranscriptFiles'
import { readTranscriptTurns } from './readTranscriptTurns'
import type { ObservationResult } from './types/ObservationResult'
import type { ObservedTurn } from './types/ObservedTurn'

export const observeTranscripts = async (
  root: string,
  seen: Record<string, number>,
): Promise<ObservationResult> => {
  const files = await listTranscriptFiles(root)
  const invocations: Record<string, number> = {}
  const turns: ObservedTurn[] = []
  const sequence: ObservedTurn[] = []
  const index: Record<string, number> = { ...seen }
  let skipped = 0

  for (const file of files) {
    const stat = await fs.stat(file)
    const modified = stat.mtimeMs

    if (seen[file] === modified) {
      skipped++
      continue
    }

    index[file] = modified

    let contents: string
    try {
      contents = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }

    for (const turn of readTranscriptTurns(contents)) {
      sequence.push(turn)

      if (turn.invokedSkill === undefined) {
        turns.push(turn)
        continue
      }

      invocations[turn.invokedSkill] = (invocations[turn.invokedSkill] ?? 0) + 1
    }
  }

  return {
    summary: {
      transcripts: files.length,
      skipped,
      requests: turns.length,
      invocations,
    },
    turns,
    sequence,
    index,
  }
}
