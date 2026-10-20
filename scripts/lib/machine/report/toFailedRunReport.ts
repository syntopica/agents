import type { RunReport } from '../types/RunReport'
import type { ToFailedRunReportInput } from './types/ToFailedRunReportInput'

export const toFailedRunReport = ({
  runId,
  profile,
  messages,
}: ToFailedRunReportInput): RunReport => ({
  runId,
  profile,
  domains: [{ domain: 'machine', status: 'failed', changes: 0, messages }],
  ok: false,
})
