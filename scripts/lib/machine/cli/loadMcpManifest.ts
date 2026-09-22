import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { parseMcpManifest } from '../domains/mcp/parseMcpManifest'
import type { ParseResult } from '../domains/mcp/types/ParseResult'

export const loadMcpManifest = async (
  instanceDir: string,
): Promise<ParseResult> => {
  let contents: string

  try {
    contents = await fs.readFile(join(instanceDir, 'mcp.json'), 'utf8')
  } catch {
    return { ok: false, errors: [`no mcp.json in ${instanceDir}`] }
  }

  try {
    return parseMcpManifest(JSON.parse(contents) as unknown)
  } catch {
    return {
      ok: false,
      errors: [`mcp.json in ${instanceDir} is not valid JSON`],
    }
  }
}
