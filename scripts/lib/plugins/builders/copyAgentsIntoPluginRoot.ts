import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathExists } from '../../link/operations/pathExists'

export const copyAgentsIntoPluginRoot = async ({
  srcAgentsDir,
  pluginAgentsDir,
}: {
  srcAgentsDir: string
  pluginAgentsDir: string
}): Promise<string[]> => {
  const srcExists = await pathExists(srcAgentsDir)
  if (!srcExists) return []

  await fs.rm(pluginAgentsDir, { recursive: true, force: true })
  await fs.mkdir(pluginAgentsDir, { recursive: true })

  const entries = await fs.readdir(srcAgentsDir, { withFileTypes: true })
  const copied: string[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const srcPath = path.join(srcAgentsDir, entry.name)
    const destPath = path.join(pluginAgentsDir, entry.name)
    await fs.copyFile(srcPath, destPath)
    copied.push(entry.name)
  }

  return copied.sort((a, b) => a.localeCompare(b))
}
