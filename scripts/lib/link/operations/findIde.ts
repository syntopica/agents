import { IDE_REGISTRY } from '../constants/IDE_REGISTRY'

export const findIde = (id: string) => {
  const ide = IDE_REGISTRY.find((entry) => (entry as { id: string }).id === id)
  if (!ide) {
    throw new Error(`Unknown IDE: ${id}`)
  }
  return ide
}
