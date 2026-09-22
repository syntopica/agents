import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
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
import { resolveRunsDir } from '../lib/machine/cli/resolveRunsDir'
import { resolveSelectedDomains } from '../lib/machine/cli/resolveSelectedDomains'
import { resolveServicesPaths } from '../lib/machine/cli/resolveServicesPaths'
import { resolveTargetPaths } from '../lib/machine/cli/resolveTargetPaths'
import { toOwnedByTarget } from '../lib/machine/cli/toOwnedByTarget'
import { applySelectedCapabilityLinks } from '../lib/machine/domains/capabilities/applySelectedCapabilityLinks'
import { planCapabilityLinks } from '../lib/machine/domains/capabilities/planCapabilityLinks'
import { toCapabilityMessages } from '../lib/machine/domains/capabilities/toCapabilityMessages'
import { toCapabilityOwned } from '../lib/machine/domains/capabilities/toCapabilityOwned'
import { apply } from '../lib/machine/domains/mcp/apply'
import { applySelectedMcp } from '../lib/machine/domains/mcp/applySelectedMcp'
import { toMcpApplyDomain } from '../lib/machine/domains/mcp/toMcpApplyDomain'
import { runPluginsApply } from '../lib/machine/domains/plugins/runPluginsApply'
import { applySelectedClaudeSettings } from '../lib/machine/domains/security/applySelectedClaudeSettings'
import { planClaudeSettings } from '../lib/machine/domains/security/planClaudeSettings'
import { readClaudeSettings } from '../lib/machine/domains/security/readClaudeSettings'
import { writeClaudeSettings } from '../lib/machine/domains/security/writeClaudeSettings'
import { resolveDeclaredUnitPaths } from '../lib/machine/domains/services/resolveDeclaredUnitPaths'
import { runServicesApply } from '../lib/machine/domains/services/runServicesApply'
import { runCommand } from '../lib/machine/exec/runCommand'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'
import { readOwned } from '../lib/machine/ownership/readOwned'
import { writeOwned } from '../lib/machine/ownership/writeOwned'
import { isMachineProfile } from '../lib/machine/profiles/isMachineProfile'
import { MACHINE_PROFILES } from '../lib/machine/profiles/MACHINE_PROFILES'
import { selectProfileDomains } from '../lib/machine/profiles/selectors/selectProfileDomains'
import { formatRunReport } from '../lib/machine/report/formatters/formatRunReport'
import { toFailedRunReport } from '../lib/machine/report/toFailedRunReport'
import { createRunId } from '../lib/machine/runs/createRunId'
import { createSnapshot } from '../lib/machine/runs/createSnapshot'
import type { DomainResult } from '../lib/machine/types/DomainResult'
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
    const report = toFailedRunReport({
      runId: 'apply',
      profile: requested,
      messages: [`unknown profile ${requested}; expected full or lite`],
    })
    console.log(formatRunReport(report, asJson))
    process.exitCode = 1
    return
  }

  const profileDomains: readonly string[] = MACHINE_PROFILES[requested]
  const selection = resolveSelectedDomains({
    argv: process.argv,
    profileDomains,
  })

  if ('errors' in selection) {
    console.log(
      formatRunReport(
        toFailedRunReport({
          runId: 'apply',
          profile: requested,
          messages: selection.errors,
        }),
        asJson,
      ),
    )
    process.exitCode = 1
    return
  }

  const selected = selection.domains
  const parsed = await loadMcpManifest(instanceDir)
  const security = await loadSecurityManifest(instanceDir)

  if (!parsed.ok || !security.ok) {
    const report = toFailedRunReport({
      runId: 'apply',
      profile: requested,
      messages: [
        ...(parsed.ok ? [] : parsed.errors),
        ...(security.ok ? [] : security.errors),
      ],
    })
    console.log(formatRunReport(report, asJson))
    process.exitCode = 1
    return
  }

  const paths = resolveTargetPaths(home)
  const claudeSettingsPaths = resolveClaudeSettingsPaths(home, process.env)
  const ownedPath = resolveOwnedPath(home)
  const ownedRecord = await readOwned(ownedPath)
  const capabilityTargets = resolveCapabilityTargets()
  const capabilityPlans = await Promise.all(
    capabilityTargets.map(async (target) => ({
      target,
      changes: await planCapabilityLinks(target),
    })),
  )
  const capabilitySnapshotPaths = [
    ...new Set(
      capabilityPlans.flatMap(({ changes }) =>
        changes.map(({ target }) => target),
      ),
    ),
  ]

  const pluginsPaths = resolvePluginsPaths(home, process.env)
  const pluginsManifest = selected.includes('plugins')
    ? await loadPluginsManifest(instanceDir)
    : undefined

  const servicesPaths = resolveServicesPaths({
    home,
    platform: process.platform,
  })
  const servicesManifest = selected.includes('services')
    ? await loadServicesManifest(instanceDir)
    : undefined
  const servicesUnitPaths = resolveDeclaredUnitPaths({
    parsed: servicesManifest,
    paths: servicesPaths,
  })

  const runId = createRunId(new Date(), Math.random)
  const runDir = join(resolveRunsDir(home), runId)
  await createSnapshot({
    runDir,
    files: [
      ...Object.values(paths),
      claudeSettingsPaths['claude-personal'],
      claudeSettingsPaths['claude-secondary'],
      ownedPath,
      ...capabilitySnapshotPaths,
      ...(pluginsManifest === undefined
        ? []
        : [pluginsPaths.installed, pluginsPaths.marketplaces]),
      ...servicesUnitPaths,
    ],
  })

  const securityChanges = planClaudeSettings(
    security.manifest.claude,
    await readClaudeSettings(claudeSettingsPaths),
  )

  // A domain this run does not converge keeps the ownership it already had:
  // rewriting it from an empty apply would disown servers and links that are
  // still installed.
  const result = await applySelectedMcp({
    selected: selected.includes('mcp'),
    owned: ownedRecord,
    run: async () =>
      apply({
        manifest: parsed.manifest,
        paths,
        owned: toOwnedByTarget(ownedRecord),
        env: process.env,
      }),
  })
  const securityOwned = await applySelectedClaudeSettings({
    selected: selected.includes('security'),
    owned: ownedRecord,
    run: async () =>
      writeClaudeSettings({
        paths: claudeSettingsPaths,
        policy: security.manifest.claude,
      }),
  })
  const capabilityResults = await applySelectedCapabilityLinks({
    targets: capabilityTargets,
    selected: selected.includes('capabilities'),
  })
  const capabilityOwned = selected.includes('capabilities')
    ? toCapabilityOwned(capabilityResults)
    : (ownedRecord.capabilities ?? {})

  const pluginsDomain = await runPluginsApply({
    parsed: pluginsManifest,
    paths: pluginsPaths,
    prune: process.argv.includes('--prune-cache'),
    run: runCommand,
  })
  const servicesDomain = await runServicesApply({
    parsed: servicesManifest,
    paths: servicesPaths,
    uid: process.getuid?.() ?? 0,
    run: runCommand,
  })

  await writeOwned(ownedPath, {
    ...ownedRecord,
    mcp: result.owned,
    security: securityOwned,
    capabilities: capabilityOwned,
  })
  await fs.writeFile(join(runDir, 'complete'), '')

  const written = Object.values(result.owned).reduce(
    (total, names) => total + names.length,
    0,
  )
  const missing = [...new Set(result.missing)]
  const capabilityChanges = capabilityPlans.reduce(
    (total, capabilityPlan) => total + capabilityPlan.changes.length,
    0,
  )

  const report: RunReport = {
    runId,
    profile: requested,
    domains: selectProfileDomains({
      profile: requested,
      domains: (
        [
          toMcpApplyDomain({
            written,
            targets: Object.keys(paths).length,
            missing,
          }),
          {
            domain: 'security',
            status: securityChanges.length === 0 ? 'converged' : 'changed',
            changes: securityChanges.length,
            messages: securityChanges.map(
              (change) => `updated ${change.key} on ${change.profile}`,
            ),
          },
          {
            domain: 'capabilities',
            status: capabilityChanges === 0 ? 'converged' : 'changed',
            changes: capabilityChanges,
            messages: toCapabilityMessages(capabilityResults),
          },
          pluginsDomain,
          servicesDomain,
        ] satisfies DomainResult[]
      ).filter((domain) => selected.includes(domain.domain)),
    }),
    ok: pluginsDomain.status !== 'failed' && servicesDomain.status !== 'failed',
  }

  console.log(formatRunReport(report, asJson))
}
