import { homedir } from 'node:os'
import { join } from 'node:path'
import { formatCodexStateReport } from '../lib/codex-state/formatters/formatCodexStateReport'
import { inspectCodexState } from '../lib/codex-state/inspectCodexState'
import { isCodexStateHealthy } from '../lib/codex-state/isCodexStateHealthy'
import { redactCodexStateReport } from '../lib/codex-state/redactCodexStateReport'

export const main = async () => {
  const home = homedir()
  const report = redactCodexStateReport(
    await inspectCodexState(join(home, '.codex')),
    home,
  )
  const ok = isCodexStateHealthy(report)
  console.log(
    process.argv.includes('--json')
      ? JSON.stringify({ ok, report }, null, 2)
      : formatCodexStateReport(report),
  )
  process.exitCode = ok ? 0 : 1
}
