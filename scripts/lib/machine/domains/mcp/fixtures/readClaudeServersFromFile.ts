import { readFile } from 'node:fs/promises'
import type { ReadClaudeServersFromFileWritten } from './types/ReadClaudeServersFromFileWritten'

export const readClaudeServersFromFile = async (path: string) => {
  const written = JSON.parse(
    await readFile(path, 'utf8'),
  ) as ReadClaudeServersFromFileWritten
  return written.mcpServers
}
