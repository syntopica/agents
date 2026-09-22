import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathExists } from '../lib/codex-state/pathExists'
import { flagValue } from '../lib/machine/cli/flagValue'
import { formatPortabilityReport } from '../lib/skills/formatters/formatPortabilityReport'
import { inspectSkillLibrary } from '../lib/skills/inspectSkillLibrary'

export const main = async () => {
  const requested =
    flagValue(process.argv, '--library') ?? join(homedir(), '.agents')
  const skillsRoot = (await pathExists(join(requested, 'skills')))
    ? join(requested, 'skills')
    : requested
  const findings = await inspectSkillLibrary(skillsRoot)
  const redacted = findings.map((finding) => ({
    ...finding,
    path: finding.path.replaceAll(homedir(), '$HOME'),
  }))
  console.log(
    formatPortabilityReport(redacted, process.argv.includes('--json')),
  )
  process.exitCode = findings.some(({ kind }) => kind === 'invalid') ? 1 : 0
}
