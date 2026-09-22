import { homedir } from 'node:os'
import { ROOT } from '../constants/ROOT'
import { flagValue } from '../lib/machine/cli/flagValue'
import { loadMcpManifest } from '../lib/machine/cli/loadMcpManifest'
import { loadPluginsManifest } from '../lib/machine/cli/loadPluginsManifest'
import { loadSecurityManifest } from '../lib/machine/cli/loadSecurityManifest'
import { loadServicesManifest } from '../lib/machine/cli/loadServicesManifest'
import { resolveCapabilityTargets } from '../lib/machine/cli/resolveCapabilityTargets'
import { resolveClaudeSettingsPaths } from '../lib/machine/cli/resolveClaudeSettingsPaths'
import { resolveOwnedPath } from '../lib/machine/cli/resolveOwnedPath'
import { resolvePluginsPaths } from '../lib/machine/cli/resolvePluginsPaths'
import { resolveServicesPaths } from '../lib/machine/cli/resolveServicesPaths'
import { resolveTargetPaths } from '../lib/machine/cli/resolveTargetPaths'
import { toOwnedByTarget } from '../lib/machine/cli/toOwnedByTarget'
import { planCapabilityLinks } from '../lib/machine/domains/capabilities/planCapabilityLinks'
import { plan } from '../lib/machine/domains/mcp/plan'
import { read } from '../lib/machine/domains/mcp/read'
import { read as readPlugins } from '../lib/machine/domains/plugins/read'
import { toPluginsDomainResult } from '../lib/machine/domains/plugins/toPluginsDomainResult'
import { planClaudeSettings } from '../lib/machine/domains/security/planClaudeSettings'
import { readClaudeSettings } from '../lib/machine/domains/security/readClaudeSettings'
import { read as readServices } from '../lib/machine/domains/services/read'
import { toServicesDomainResult } from '../lib/machine/domains/services/toServicesDomainResult'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'
import { readOwned } from '../lib/machine/ownership/readOwned'
import { isMachineProfile } from '../lib/machine/profiles/isMachineProfile'
import { selectProfileDomains } from '../lib/machine/profiles/selectors/selectProfileDomains'
import { formatRunReport } from '../lib/machine/report/formatters/formatRunReport'
import type { RunReport } from '../lib/machine/types/RunReport'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const flag = flagValue(process.argv, '--instance')

  const instanceDir = resolveInstanceDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    root: ROOT,
  })

  const requested = flagValue(process.argv, '--profile') ?? 'full'

  if (!isMachineProfile(requested)) {
    const report: RunReport = {
      runId: 'diff',
      profile: requested,
      domains: [
        {
          domain: 'machine',
          status: 'failed',
          changes: 0,
          messages: [`unknown profile ${requested}; expected full or lite`],
        },
      ],
      ok: false,
    }
    console.log(formatRunReport(report, asJson))
    process.exitCode = 1
    return
  }

  const parsed = await loadMcpManifest(instanceDir)
  const security = await loadSecurityManifest(instanceDir)

  if (!parsed.ok || !security.ok) {
    const errors = [
      ...(parsed.ok ? [] : parsed.errors),
      ...(security.ok ? [] : security.errors),
    ]
    const report: RunReport = {
      runId: 'diff',
      profile: requested,
      domains: [
        { domain: 'machine', status: 'failed', changes: 0, messages: errors },
      ],
      ok: false,
    }
    console.log(formatRunReport(report, asJson))
    process.exitCode = 1
    return
  }

  const paths = resolveTargetPaths(home)
  const claudeSettingsPaths = resolveClaudeSettingsPaths(home, process.env)
  const owned = toOwnedByTarget(await readOwned(resolveOwnedPath(home)))

  const changes = plan({
    manifest: parsed.manifest,
    state: await read(paths),
    owned,
    env: process.env,
  })
  const securityChanges = planClaudeSettings(
    security.manifest.claude,
    await readClaudeSettings(claudeSettingsPaths),
  )
  const capabilityTargets = resolveCapabilityTargets()
  const capabilityPlans = await Promise.all(
    capabilityTargets.map(async (target) => ({
      target,
      changes: await planCapabilityLinks(target),
    })),
  )
  const capabilityChanges = capabilityPlans.flatMap(({ target, changes }) =>
    changes.map((change) => ({ ...change, id: target.id })),
  )
  const plugins = toPluginsDomainResult({
    parsed: await loadPluginsManifest(instanceDir),
    state: await readPlugins(resolvePluginsPaths(home, process.env)),
  })

  const servicesPaths = resolveServicesPaths({
    home,
    platform: process.platform,
  })
  const services = toServicesDomainResult({
    parsed: await loadServicesManifest(instanceDir),
    platform: servicesPaths.platform,
    state: await readServices(servicesPaths),
  })

  const report: RunReport = {
    runId: 'diff',
    profile: requested,
    domains: selectProfileDomains({
      profile: requested,
      domains: [
        {
          domain: 'mcp',
          status: changes.length === 0 ? 'converged' : 'changed',
          changes: changes.length,
          messages: changes.map(
            (change) =>
              `${change.operation} ${change.name} on ${change.target}`,
          ),
        },
        {
          domain: 'security',
          status: securityChanges.length === 0 ? 'converged' : 'changed',
          changes: securityChanges.length,
          messages: securityChanges.map(
            (change) => `update ${change.key} on ${change.profile}`,
          ),
        },
        {
          domain: 'capabilities',
          status: capabilityChanges.length === 0 ? 'converged' : 'changed',
          changes: capabilityChanges.length,
          messages: capabilityChanges.map(
            (change) => `${change.operation} ${change.target} for ${change.id}`,
          ),
        },
        plugins,
        services,
      ],
    }),
    ok: true,
  }

  console.log(formatRunReport(report, asJson))
}
