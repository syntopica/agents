import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { sortRecordKeys } from './sortRecordKeys'

export const writeGeminiSettings = async ({
  path,
  servers,
  ownedNames,
}: {
  path: string
  servers: Record<string, unknown>
  ownedNames: string[]
}) => {
  let existing: Record<string, unknown> = {}
  try {
    const contents = await readFile(path, 'utf8')
    if (contents.trim() !== '')
      existing = JSON.parse(contents) as Record<string, unknown>
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const currentServers =
    typeof existing['mcpServers'] === 'object' &&
    existing['mcpServers'] !== null
      ? (existing['mcpServers'] as Record<string, unknown>)
      : {}
  const merged: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(currentServers)) {
    if (!ownedNames.includes(name) && !(name in servers)) merged[name] = value
  }
  Object.assign(merged, servers)

  await mkdir(dirname(path), { recursive: true })
  await writeFile(
    path,
    `${JSON.stringify({ ...existing, mcpServers: sortRecordKeys(merged) }, null, 2)}\n`,
  )
  return Object.keys(servers)
}
