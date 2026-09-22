import { promises as fs } from 'node:fs'
import { readCodexSkillReads } from './readCodexSkillReads'
import { toCodexInvocationText } from './toCodexInvocationText'

/**
 * Counts skill reads in one rollout, looking only at the lines where the agent
 * invoked a tool. Scanning the whole file instead counts the injected skill
 * catalogue and command output, which is what made these numbers meaningless.
 */
export const readCodexSkillReadsFromFile = async (path: string) => {
  let contents: string

  try {
    contents = await fs.readFile(path, 'utf8')
  } catch {
    return {}
  }

  const counts: Record<string, number> = {}

  for (const line of contents.split('\n')) {
    const invocation = toCodexInvocationText(line)

    if (invocation === undefined) {
      continue
    }

    for (const [skill, count] of Object.entries(
      readCodexSkillReads(invocation),
    )) {
      counts[skill] = (counts[skill] ?? 0) + count
    }
  }

  return counts
}
