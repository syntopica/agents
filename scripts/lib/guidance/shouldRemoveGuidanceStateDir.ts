import { access } from 'node:fs/promises'

export const shouldRemoveGuidanceStateDir = async (
  stateDir: string,
  dryRun: boolean,
): Promise<boolean> => {
  if (!dryRun) return false
  try {
    await access(stateDir)
    return false
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
    throw error
  }
}
