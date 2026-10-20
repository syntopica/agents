import { installCopiedSkill } from './installCopiedSkill'
import { installLink } from './installLink'
import type { InstallPlannedLinksInput } from './types/InstallPlannedLinksInput'
import type { InstallPlannedLinksResult } from './types/InstallPlannedLinksResult'

export const installPlannedLinks = async ({
  links,
  linkDir,
  dryRun,
  strategy,
}: InstallPlannedLinksInput): Promise<InstallPlannedLinksResult> => {
  const created: string[] = []
  const missing: string[] = []
  const foreign: string[] = []

  for (const link of links) {
    const outcome =
      strategy === 'copy'
        ? await installCopiedSkill(link, linkDir, dryRun)
        : await installLink(link, linkDir, dryRun)

    if (outcome.kind === 'created') created.push(link.name)
    if (outcome.kind === 'missing') missing.push(outcome.message)
    if (outcome.kind === 'foreign') foreign.push(outcome.message)
  }

  return { created, missing, foreign }
}
