import { homedir } from 'node:os'
import { applyTransition } from '../lib/library/applyTransition'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { writeCurationManifest } from '../lib/library/cli/writeCurationManifest'
import { CURATION_STATES } from '../lib/library/constants/CURATION_STATES'
import type { CurationState } from '../lib/library/types/CurationState'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const flag = flagValue(process.argv, '--library')
  const skill = flagValue(process.argv, '--skill')
  const state = flagValue(process.argv, '--state')
  const reason = flagValue(process.argv, '--reason')
  const today =
    flagValue(process.argv, '--date') ?? new Date().toISOString().slice(0, 10)

  if (skill === undefined || state === undefined) {
    console.error(
      'usage: library:curate --skill <name> --state <state> [--reason <why>]',
    )
    process.exitCode = 1
    return
  }

  if (!(CURATION_STATES as readonly string[]).includes(state)) {
    console.error(
      `unknown state ${state}; expected one of ${CURATION_STATES.join(', ')}`,
    )
    process.exitCode = 1
    return
  }

  const libraryDir = resolveLibraryDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    home: homedir(),
  })

  const parsed = await readCurationManifest(libraryDir)

  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  const result = applyTransition(
    parsed.manifest,
    skill,
    state as CurationState,
    reason === undefined ? {} : { reason },
    today,
  )

  if (!result.ok) {
    console.error(result.error)
    process.exitCode = 1
    return
  }

  if (!process.argv.includes('--dry-run')) {
    await writeCurationManifest(libraryDir, result.manifest)
  }

  const suffix = reason === undefined ? '' : ` (${reason})`
  console.log(`${skill}: ${state}${suffix}`)
}
