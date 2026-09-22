import type { CapabilityStatus } from './types/CapabilityStatus'

export const classifyLiveProbe = (
  output: string,
  exitCode: number | null,
  timedOut: boolean,
): CapabilityStatus => {
  if (timedOut) return 'failed'
  if (/no MCP servers configured/i.test(output)) return 'failed'
  if (/logged in using an API key/i.test(output)) return 'failed'
  if (/failed to connect|failed to import|disconnected/i.test(output))
    return 'degraded'
  if (
    /needs authentication|signed.?out|authentication required/i.test(output)
  ) {
    return 'auth-required'
  }
  return exitCode === 0 ? 'healthy' : 'failed'
}
