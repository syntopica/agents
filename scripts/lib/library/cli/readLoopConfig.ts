import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { ReadLoopConfigParsed } from './types/ReadLoopConfigParsed'
import type { ReadLoopConfigResult } from './types/ReadLoopConfigResult'

export const readLoopConfig = async (
  learningDir: string,
): Promise<ReadLoopConfigResult> => {
  try {
    const parsed = JSON.parse(
      await fs.readFile(join(learningDir, 'loop-config.json'), 'utf8'),
    ) as ReadLoopConfigParsed

    return typeof parsed.classifyCommand === 'string'
      ? { classifyCommand: parsed.classifyCommand }
      : {}
  } catch {
    return {}
  }
}
