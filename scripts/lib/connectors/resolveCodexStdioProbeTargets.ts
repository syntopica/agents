import { desiredCodexServers } from '../machine/domains/mcp/desiredCodexServers'
import type { McpManifest } from '../machine/domains/mcp/types/McpManifest'
import type { CodexStdioProbeTarget } from './types/CodexStdioProbeTarget'
import type { CodexStdioProbeTargetResolution } from './types/CodexStdioProbeTargetResolution'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

export const resolveCodexStdioProbeTargets = (
  definitions: ConnectorDefinition[],
  manifest: McpManifest,
  env: NodeJS.ProcessEnv,
): CodexStdioProbeTargetResolution => {
  const required = definitions.filter(
    (definition) =>
      definition.profiles.includes('codex') &&
      definition.criticality === 'required' &&
      definition.ownership === 'machine',
  )
  let desired: ReturnType<typeof desiredCodexServers>
  try {
    desired = desiredCodexServers(manifest, env)
  } catch {
    return {
      ok: false,
      errors: ['required Codex MCP probe configuration cannot be resolved'],
    }
  }

  const errors: string[] = []
  const targets = new Map<string, CodexStdioProbeTarget>()
  for (const definition of required) {
    const server = manifest.servers[definition.match]
    if (
      server === undefined ||
      !server.targets.includes('codex') ||
      server.disabled === true
    ) {
      errors.push(
        `${definition.id}: required Codex MCP configuration cannot be resolved`,
      )
      continue
    }
    if (server.transport !== 'stdio') continue

    const resolved = desired[definition.match]
    if (resolved?.command === undefined || resolved.command.length === 0) {
      errors.push(
        `${definition.id}: required Codex STDIO probe configuration cannot be resolved`,
      )
      continue
    }
    targets.set(definition.id, {
      command: resolved.command,
      args: resolved.args ?? [],
      timeoutMs:
        resolved.startup_timeout_sec === undefined
          ? undefined
          : resolved.startup_timeout_sec * 1_000,
    })
  }

  return errors.length === 0 ? { ok: true, targets } : { ok: false, errors }
}
