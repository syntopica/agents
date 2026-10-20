import { IDE_REGISTRY } from '../constants/IDE_REGISTRY'
import type { IdeIdentifier } from './types/IdeIdentifier'

export const findIde = (id: string) => {
  const ide = IDE_REGISTRY.find((entry) => (entry as IdeIdentifier).id === id)
  if (!ide) {
    throw new Error(`Unknown IDE: ${id}`)
  }
  return ide
}
