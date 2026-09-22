import { readFile } from 'node:fs/promises'

export const readClaudeServersFromFile = async (path: string) => {
  const written = JSON.parse(await readFile(path, 'utf8')) as {
    mcpServers: Record<string, unknown>
  }
  return written.mcpServers
}
