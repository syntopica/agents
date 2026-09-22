import { promises as fs } from 'node:fs'
import { copyDirRecursive } from '../../../operations/copyDirRecursive'
import { pathExists } from '../../link/operations/pathExists'

export const copyHooksIntoPluginRoot = async ({
  srcHooksDir,
  pluginHooksDir,
}: {
  srcHooksDir: string
  pluginHooksDir: string
}): Promise<number> => {
  if (!(await pathExists(srcHooksDir))) return 0

  await fs.rm(pluginHooksDir, { recursive: true, force: true })
  await copyDirRecursive(srcHooksDir, pluginHooksDir)

  const entries = await fs.readdir(pluginHooksDir)
  return entries.length
}
