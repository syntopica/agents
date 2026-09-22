import { homedir } from 'node:os'
import { join } from 'node:path'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { readSkillDescription } from '../lib/library/cli/readSkillDescription'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { formatDescriptionProposals } from '../lib/library/formatters/formatDescriptionProposals'
import { phraseIsCoveredByDescription } from '../lib/library/phraseIsCoveredByDescription'
import { proposeDescriptionEdit } from '../lib/library/proposeDescriptionEdit'
import type { DescriptionProposal } from '../lib/library/types/DescriptionProposal'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const libraryFlag = flagValue(process.argv, '--library')

  const libraryDir = resolveLibraryDir({
    ...(libraryFlag === undefined ? {} : { flag: libraryFlag }),
    env: process.env,
    home,
  })

  const parsed = await readCurationManifest(libraryDir)

  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  const proposals: DescriptionProposal[] = []

  for (const [name, entry] of Object.entries(parsed.manifest.entries)) {
    const triggers = entry.triggers ?? []

    if (triggers.length === 0) {
      continue
    }

    const description = await readSkillDescription(
      join(libraryDir, 'skills', name),
    )

    if (description === undefined) {
      continue
    }

    const proposal = proposeDescriptionEdit(
      name,
      description,
      triggers,
      phraseIsCoveredByDescription,
    )

    if (proposal !== undefined) {
      proposals.push(proposal)
    }
  }

  console.log(
    asJson
      ? JSON.stringify({ proposals }, null, 2)
      : formatDescriptionProposals(proposals),
  )
}
