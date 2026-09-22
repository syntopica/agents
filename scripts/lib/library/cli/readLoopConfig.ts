import { promises as fs } from 'node:fs'
import { join } from 'node:path'

export const readLoopConfig = async (
  learningDir: string,
): Promise<{ classifyCommand?: string }> => {
  try {
    const parsed = JSON.parse(
      await fs.readFile(join(learningDir, 'loop-config.json'), 'utf8'),
    ) as {
      classifyCommand?: unknown
    }

    return typeof parsed.classifyCommand === 'string'
      ? { classifyCommand: parsed.classifyCommand }
      : {}
  } catch {
    return {}
  }
}
