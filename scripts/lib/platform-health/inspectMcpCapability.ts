import { promises as fs } from 'node:fs'
import { extname } from 'node:path'
import type { CapabilityHealth } from './types/CapabilityHealth'

export const inspectMcpCapability = async (
  configPath: string | undefined,
): Promise<CapabilityHealth> => {
  if (configPath === undefined) {
    return {
      capability: 'mcp',
      status: 'unsupported',
      summary: 'no MCP adapter',
      findings: [],
    }
  }

  try {
    const contents = await fs.readFile(configPath, 'utf8')
    if (extname(configPath) === '.json') JSON.parse(contents)
    else if (contents.trim().length === 0) throw new Error('empty config')
    return {
      capability: 'mcp',
      status: 'healthy',
      summary: 'MCP configuration is readable',
      findings: [],
    }
  } catch {
    return {
      capability: 'mcp',
      status: 'failed',
      summary: 'MCP configuration is unreadable',
      findings: [configPath],
    }
  }
}
