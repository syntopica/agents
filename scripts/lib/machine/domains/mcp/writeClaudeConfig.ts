import { promises as fs } from 'node:fs'
import { readExistingJson } from './readExistingJson'
import { sortRecordKeys } from './sortRecordKeys'
import type { WriteClaudeConfigInput } from './types/WriteClaudeConfigInput'

export const writeClaudeConfig = async ({
  path,
  servers,
  ownedNames,
}: WriteClaudeConfigInput) => {
  const existing = await readExistingJson(path)
  const currentServers = (existing['mcpServers'] ?? {}) as Record<
    string,
    unknown
  >
  const merged: Record<string, unknown> = {}

  for (const [name, value] of Object.entries(currentServers)) {
    if (!ownedNames.includes(name) && !(name in servers)) {
      merged[name] = value
    }
  }

  for (const [name, value] of Object.entries(servers)) {
    merged[name] = value
  }

  await fs.writeFile(
    path,
    `${JSON.stringify({ ...existing, mcpServers: sortRecordKeys(merged) }, null, 2)}\n`,
  )

  return Object.keys(servers)
}
