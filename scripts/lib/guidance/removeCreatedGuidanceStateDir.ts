import { rmdir } from 'node:fs/promises'

export const removeCreatedGuidanceStateDir = async (
  stateDir: string,
  shouldRemove: boolean,
): Promise<void> => {
  if (shouldRemove) await rmdir(stateDir).catch(() => undefined)
}
