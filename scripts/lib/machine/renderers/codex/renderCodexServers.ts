import type { McpManifest } from '../../domains/mcp/types/McpManifest'
import { resolveValueMap } from '../claude/resolveValueMap'
import { renderCodexServer } from './renderCodexServer'

export const renderCodexServers = (
  manifest: McpManifest,
  env: NodeJS.ProcessEnv,
) => {
  const blocks: string[] = []
  const missing: string[] = []
  const names: string[] = []

  for (const [name, server] of Object.entries(manifest.servers)) {
    if (!server.targets.includes('codex')) {
      continue
    }

    const envMap = resolveValueMap(server.env ?? {}, env)
    if (envMap.missing.length > 0) {
      missing.push(...envMap.missing)
      continue
    }

    blocks.push(renderCodexServer(name, server, envMap.values))
    names.push(name)
  }

  return { toml: blocks.join('\n\n'), missing, names }
}
