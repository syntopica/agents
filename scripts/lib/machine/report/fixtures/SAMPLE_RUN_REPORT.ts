import type { RunReport } from '../../types/RunReport'

export const SAMPLE_RUN_REPORT: RunReport = {
  runId: '2026-08-17T22-04-05-abc',
  profile: 'full',
  domains: [
    {
      domain: 'mcp',
      status: 'changed',
      changes: 3,
      messages: ['add serena to codex'],
    },
    { domain: 'plugins', status: 'converged', changes: 0, messages: [] },
  ],
  ok: true,
}
