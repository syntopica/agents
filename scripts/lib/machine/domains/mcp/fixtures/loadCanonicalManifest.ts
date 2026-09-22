import { readFile } from 'node:fs/promises'
import { parseMcpManifest } from '../parseMcpManifest'
import type { McpManifest } from '../types/McpManifest'

export const loadCanonicalManifest = async (): Promise<McpManifest> => {
  const raw = JSON.parse(
    await readFile('examples/machine/mcp.json', 'utf8'),
  ) as unknown
  const parsed = parseMcpManifest(raw)

  if (!parsed.ok) {
    throw new Error(
      `canonical manifest must be valid: ${parsed.errors.join(', ')}`,
    )
  }

  return parsed.manifest
}
