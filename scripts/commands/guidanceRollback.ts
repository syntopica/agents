import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { readAliasedGuidanceFlag } from '../lib/guidance/cli/readAliasedGuidanceFlag'
import { readGuidanceFlag } from '../lib/guidance/cli/readGuidanceFlag'
import { guidanceRollback } from '../lib/guidance/guidanceRollback'

export const main = async (): Promise<void> => {
  const home = readGuidanceFlag(process.argv, '--home') ?? homedir()
  const canonicalDir =
    readAliasedGuidanceFlag(process.argv, '--config', '--canonical-dir') ??
    join(home, '.config', 'rocket-agents', 'agent-guidance')
  const stateDir =
    readGuidanceFlag(process.argv, '--state-dir') ??
    join(home, '.local', 'state', 'rocket-agents', 'guidance', 'default')
  const requestedRun = readAliasedGuidanceFlag(process.argv, '--run', '--to')
  const report = await guidanceRollback({
    home: resolve(home),
    canonicalDir: resolve(canonicalDir),
    stateDir: resolve(stateDir),
    ...(requestedRun === undefined ? {} : { runId: requestedRun }),
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
