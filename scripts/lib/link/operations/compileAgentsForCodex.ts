import { promises as fs } from 'node:fs'
import path from 'node:path'
import { renderCodexAgent } from '../renderers/renderCodexAgent'

export const compileAgentsForCodex = async ({
  srcAgentsDir,
  outputAgentsDir,
}: {
  srcAgentsDir: string
  outputAgentsDir: string
}): Promise<string[]> => {
  await fs.rm(outputAgentsDir, { recursive: true, force: true })
  await fs.mkdir(outputAgentsDir, { recursive: true })

  const entries = await fs.readdir(srcAgentsDir, { withFileTypes: true })
  const compiled: string[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const source = await fs.readFile(
      path.join(srcAgentsDir, entry.name),
      'utf8',
    )
    const targetName = entry.name.replace(/\.md$/, '.toml')
    await fs.writeFile(
      path.join(outputAgentsDir, targetName),
      renderCodexAgent(source),
      'utf8',
    )
    compiled.push(targetName)
  }

  return compiled.sort((left, right) => left.localeCompare(right))
}
