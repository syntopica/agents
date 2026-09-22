import { renderCodexServers } from '../../renderers/codex/renderCodexServers'
import { CODEX_SECTION_PATTERN } from './constants/CODEX_SECTION_PATTERN'
import { normalizeCodexServer } from './normalizeCodexServer'
import { parseTomlServerSections } from './parseTomlServerSections'
import type { McpManifest } from './types/McpManifest'
import type { NormalizedCodexServer } from './types/NormalizedCodexServer'

export const desiredCodexServers = (
  manifest: McpManifest,
  env: NodeJS.ProcessEnv,
) => {
  const { toml } = renderCodexServers(manifest, env)
  const records = parseTomlServerSections(toml, CODEX_SECTION_PATTERN)
  const normalized: Record<string, NormalizedCodexServer> = {}

  for (const [name, record] of Object.entries(records)) {
    normalized[name] = normalizeCodexServer(record)
  }

  return normalized
}
