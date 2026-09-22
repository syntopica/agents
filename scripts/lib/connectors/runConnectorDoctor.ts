import { connectorExitCode } from './connectorExitCode'
import { resolveCodexStdioProbeTargets } from './resolveCodexStdioProbeTargets'
import { resolveConnectorProfiles } from './resolveConnectorProfiles'
import type { ConnectorDoctorInput } from './types/ConnectorDoctorInput'
import type { ConnectorDoctorResult } from './types/ConnectorDoctorResult'

export const runConnectorDoctor = async (
  input: ConnectorDoctorInput,
): Promise<ConnectorDoctorResult> => {
  const { parsed } = input
  if (!parsed.ok) {
    return { exitCode: 2, output: { ok: false, errors: parsed.errors } }
  }
  if (!input.parsedMcp.ok) {
    return {
      exitCode: 2,
      output: { ok: false, errors: ['MCP manifest is missing or invalid'] },
    }
  }
  const resolved = resolveCodexStdioProbeTargets(
    parsed.manifest.connectors,
    input.parsedMcp.manifest,
    input.env,
  )
  if (!resolved.ok) {
    return { exitCode: 2, output: { ok: false, errors: resolved.errors } }
  }
  const results = (
    await Promise.all(
      resolveConnectorProfiles(input.requestedProfile).map((profile) =>
        input.inspect(
          profile,
          parsed.manifest.connectors,
          input.home,
          resolved.targets,
        ),
      ),
    )
  ).flat()
  const exitCode = connectorExitCode(results)
  return { exitCode, output: { ok: exitCode === 0, connectors: results } }
}
