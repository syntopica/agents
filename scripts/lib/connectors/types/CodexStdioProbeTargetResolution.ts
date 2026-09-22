import type { CodexStdioProbeTarget } from './CodexStdioProbeTarget'

export type CodexStdioProbeTargetResolution =
  | { ok: true; targets: ReadonlyMap<string, CodexStdioProbeTarget> }
  | { ok: false; errors: string[] }
