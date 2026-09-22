import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { readAliasedGuidanceFlag } from '../lib/guidance/cli/readAliasedGuidanceFlag'
import { readGuidanceFlag } from '../lib/guidance/cli/readGuidanceFlag'
import { guidanceDoctor } from '../lib/guidance/guidanceDoctor'

export const main = async (): Promise<void> => {
  const home = readGuidanceFlag(process.argv, '--home') ?? homedir()
  const canonicalDir =
    readAliasedGuidanceFlag(process.argv, '--config', '--canonical-dir') ??
    join(home, '.config', 'rocket-agents', 'agent-guidance')
  const stateDir =
    readGuidanceFlag(process.argv, '--state-dir') ??
    join(home, '.local', 'state', 'rocket-agents', 'guidance', 'default')
  const report = await guidanceDoctor({
    home: resolve(home),
    canonicalDir: resolve(canonicalDir),
    stateDir: resolve(stateDir),
  })
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
