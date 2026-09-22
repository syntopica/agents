import { redactHealthText } from './redactHealthText'
import type { PlatformHealth } from './types/PlatformHealth'

export const redactHealthReport = (
  report: PlatformHealth[],
  home: string,
): PlatformHealth[] =>
  report.map((platform) => ({
    ...platform,
    probes: platform.probes.map((probe) => ({
      ...probe,
      candidate: redactHealthText(probe.candidate, home),
      ...(probe.resolvedPath === undefined
        ? {}
        : { resolvedPath: redactHealthText(probe.resolvedPath, home) }),
    })),
    capabilities: platform.capabilities.map((capability) => ({
      ...capability,
      summary: redactHealthText(capability.summary, home),
      findings: capability.findings.map((finding) =>
        redactHealthText(finding, home),
      ),
    })),
  }))
