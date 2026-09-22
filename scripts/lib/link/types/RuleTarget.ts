import type { IdeRegistryEntry } from './IdeRegistryEntry'

export interface RuleTarget {
  ide: IdeRegistryEntry
  cleanup?: {
    dir: string
    prefix: string
  }
  links: {
    target: string
    method: 'copy' | 'symlink'
    source: string
  }[]
}
