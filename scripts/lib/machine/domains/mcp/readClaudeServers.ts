import { readExistingJson } from './readExistingJson'

export const readClaudeServers = async (
  configPath: string,
): Promise<Record<string, unknown>> => {
  const parsed = await readExistingJson(configPath)
  const servers = parsed['mcpServers']

  if (typeof servers !== 'object' || servers === null) {
    return {}
  }

  return servers as Record<string, unknown>
}
