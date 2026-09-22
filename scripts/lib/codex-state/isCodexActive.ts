import { hasCodexWriterLock } from './hasCodexWriterLock'
import { readProcessTable } from './readProcessTable'
import type { CodexActivity } from './types/CodexActivity'

export const isCodexActive = async (
  codexDir: string,
  processTable?: string,
): Promise<CodexActivity> => {
  const table = processTable ?? (await readProcessTable())
  const processActive = table
    .split('\n')
    .some((line) =>
      /(?:^|\/)codex(?:\s|$)/i.test(line.replace(/^\s*\d+\s+/, '')),
    )
  const lockActive = await hasCodexWriterLock(codexDir)
  const reasons = [
    ...(processActive ? ['Codex process is active'] : []),
    ...(lockActive ? ['Codex thread writer lock is active'] : []),
  ]
  return { active: reasons.length > 0, reasons }
}
