import { homedir } from 'node:os'
import { ROOT } from '../constants/ROOT'
import { inspectClaudeConnectorCapability } from '../lib/connectors/inspectClaudeConnectorCapability'
import { loadConnectorManifest } from '../lib/connectors/loadConnectorManifest'
import { flagValue } from '../lib/machine/cli/flagValue'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'
import { applyLiveProbe } from '../lib/platform-health/applyLiveProbe'
import { LIVE_PROBES } from '../lib/platform-health/constants/LIVE_PROBES'
import { detectPlatformRuntime } from '../lib/platform-health/detectPlatformRuntime'
import { formatHealthMatrix } from '../lib/platform-health/formatters/formatHealthMatrix'
import { healthExitCode } from '../lib/platform-health/healthExitCode'
import { inspectPlatform } from '../lib/platform-health/inspectPlatform'
import { loadPlatformManifest } from '../lib/platform-health/loadPlatformManifest'
import { redactHealthReport } from '../lib/platform-health/redactHealthReport'
import { redactHealthText } from '../lib/platform-health/redactHealthText'
import { resolveCapabilityInspectionPaths } from '../lib/platform-health/resolveCapabilityInspectionPaths'
import { runLiveProbe } from '../lib/platform-health/runLiveProbe'

export const main = async () => {
  const home = homedir()
  const flag = flagValue(process.argv, '--instance')
  const instanceDir = resolveInstanceDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    root: ROOT,
  })
  const parsed = await loadPlatformManifest(instanceDir)
  if (!parsed.ok) {
    const errors = parsed.errors.map((error) => redactHealthText(error, home))
    console.log(JSON.stringify({ ok: false, errors }, null, 2))
    process.exitCode = healthExitCode([], false)
    return
  }
  const connectors = await loadConnectorManifest(instanceDir)
  if (!connectors.ok) {
    const errors = connectors.errors.map((error) =>
      redactHealthText(error, home),
    )
    console.log(JSON.stringify({ ok: false, errors }, null, 2))
    process.exitCode = healthExitCode([], false)
    return
  }

  const report = []
  for (const definition of parsed.manifest.platforms) {
    const runtime = await detectPlatformRuntime(definition, {
      env: process.env,
      home,
    })
    let health = await inspectPlatform({
      definition,
      runtime,
      paths: resolveCapabilityInspectionPaths(
        definition.registryId,
        home,
        process.env,
      ),
    })
    if (runtime.lifecycle === 'active') {
      if (definition.registryId === 'claude') {
        health = applyLiveProbe(
          health,
          await inspectClaudeConnectorCapability(
            connectors.manifest.connectors,
            home,
          ),
        )
      }
      for (const probe of LIVE_PROBES.filter(
        ({ platformId, capability }) =>
          platformId === definition.registryId &&
          !(definition.registryId === 'claude' && capability === 'mcp'),
      )) {
        health = applyLiveProbe(health, await runLiveProbe(probe))
      }
    }
    report.push(health)
  }

  const redacted = redactHealthReport(report, home)
  const exitCode = healthExitCode(redacted, true)
  console.log(
    process.argv.includes('--json')
      ? JSON.stringify({ ok: exitCode === 0, platforms: redacted }, null, 2)
      : formatHealthMatrix(redacted),
  )
  process.exitCode = exitCode
}
