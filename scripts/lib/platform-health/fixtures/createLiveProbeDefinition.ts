import type { LiveProbeDefinition } from '../types/LiveProbeDefinition'

/**
 * The timeout is deliberately generous: these cases classify probe output, not
 * latency, and a one-second budget turned into false failures whenever the
 * machine was busy enough that spawning the script alone took longer. The
 * timeout path has its own case, which passes a short budget explicitly.
 */
export const createLiveProbeDefinition = (
  command: string,
): LiveProbeDefinition => ({
  platformId: 'test',
  capability: 'mcp',
  command,
  args: [],
  timeoutMs: 30_000,
})
