import { promises as fs } from 'node:fs'
import path from 'node:path'
import { linkOneWithBackup } from './linkOneWithBackup'
import { pathExists } from './pathExists'

export const linkAgentsToClaude = async ({
  srcAgentsDir,
  targetAgentsDir,
}: {
  srcAgentsDir: string
  targetAgentsDir: string
}): Promise<string[]> => {
  if (!(await pathExists(srcAgentsDir))) return []
  await fs.mkdir(targetAgentsDir, { recursive: true })

  const entries = await fs.readdir(srcAgentsDir, { withFileTypes: true })
  const linked: string[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const source = path.join(srcAgentsDir, entry.name)
    const target = path.join(targetAgentsDir, entry.name)
    const result = await linkOneWithBackup({ source, target })
    if (result.status !== 'unchanged') {
      linked.push(entry.name)
    }
  }

  return linked
}
