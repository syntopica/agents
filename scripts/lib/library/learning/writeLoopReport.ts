import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { LoopReportSection } from './types/LoopReportSection'

export const writeLoopReport = async (
  reportsDir: string,
  date: string,
  sections: LoopReportSection[],
) => {
  const lines = [`# Library loop report - ${date}`, '']

  for (const section of sections) {
    lines.push(
      `## ${section.title}`,
      '',
      section.body.trim() || '(no output)',
      '',
    )
  }

  await fs.mkdir(reportsDir, { recursive: true })
  const path = join(reportsDir, `${date}-library-loop.md`)
  await fs.writeFile(path, `${lines.join('\n')}\n`)

  return path
}
