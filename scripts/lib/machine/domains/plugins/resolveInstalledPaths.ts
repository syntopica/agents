import { toRealPath } from './toRealPath'
import type { InstalledPlugin } from './types/InstalledPlugin'

export const resolveInstalledPaths = async (
  installed: InstalledPlugin[],
): Promise<string[]> =>
  Promise.all(installed.map(async (plugin) => toRealPath(plugin.installPath)))
