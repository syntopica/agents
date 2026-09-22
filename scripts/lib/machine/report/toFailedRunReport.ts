import type { RunReport } from '../types/RunReport'

export const toFailedRunReport = ({
  runId,
  profile,
  messages,
}: {
  runId: string
  profile: string
  messages: string[]
}): RunReport => ({
  runId,
  profile,
  domains: [{ domain: 'machine', status: 'failed', changes: 0, messages }],
  ok: false,
})
