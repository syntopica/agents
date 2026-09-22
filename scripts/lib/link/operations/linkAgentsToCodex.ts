import { promises as fs } from 'node:fs'
import path from 'node:path'
import { linkOneWithBackup } from './linkOneWithBackup'
import { pathExists } from './pathExists'

export const linkAgentsToCodex = async ({
  compiledAgentsDir,
  targetAgentsDir,
}: {
  compiledAgentsDir: string
  targetAgentsDir: string
}): Promise<string[]> => {
  if (!(await pathExists(compiledAgentsDir))) return []
  await fs.mkdir(targetAgentsDir, { recursive: true })

  const entries = await fs.readdir(compiledAgentsDir, { withFileTypes: true })
  const linked: string[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.toml')) continue
    const result = await linkOneWithBackup({
      source: path.join(compiledAgentsDir, entry.name),
      target: path.join(targetAgentsDir, entry.name),
    })
    if (result.status !== 'unchanged') linked.push(entry.name)
  }

  return linked
}
