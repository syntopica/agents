import type { PlannedLink } from './PlannedLink'

export interface InstallPlannedLinksInput {
  links: PlannedLink[]
  linkDir: string
  dryRun: boolean
  strategy: 'symlink' | 'copy'
}
