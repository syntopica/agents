import { installCopiedSkill } from './installCopiedSkill'
import { installLink } from './installLink'
import type { PlannedLink } from './types/PlannedLink'

export const installPlannedLinks = async ({
  links,
  linkDir,
  dryRun,
  strategy,
}: {
  links: PlannedLink[]
  linkDir: string
  dryRun: boolean
  strategy: 'symlink' | 'copy'
}): Promise<{ created: string[]; missing: string[]; foreign: string[] }> => {
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
