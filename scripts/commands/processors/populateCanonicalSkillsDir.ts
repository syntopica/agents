import { promises as fs } from 'node:fs'
import { cleanGlobalPrefix } from '../../lib/link/operations/cleanGlobalPrefix'
import { copySkillsToTarget } from '../../lib/link/operations/copySkillsToTarget'
import { removeStaleNamespaceEntries } from '../../lib/link/operations/removeStaleNamespaceEntries'

export const populateCanonicalSkillsDir = async ({
  source,
  target,
  skillNames,
}: {
  source: string
  target: string
  skillNames: string[]
}): Promise<void> => {
  await fs.mkdir(target, { recursive: true })
  await cleanGlobalPrefix(target, 'busirocket-')
  await cleanGlobalPrefix(target, 'brp-')
  await cleanGlobalPrefix(target, 'brp')
  await cleanGlobalPrefix(target, 'react-doctor')
  await removeStaleNamespaceEntries(target, skillNames)
  await copySkillsToTarget({
    sourceDir: source,
    targetDir: target,
    skillNames,
    prefix: '',
  })
}
