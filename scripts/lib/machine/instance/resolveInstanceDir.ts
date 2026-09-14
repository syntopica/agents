import { join } from 'node:path'
import type { ResolveInstanceDirOptions } from './types/ResolveInstanceDirOptions'

export const resolveInstanceDir = ({
  flag,
  env,
  root,
}: ResolveInstanceDirOptions) => {
  if (flag) {
    return flag
  }

  const fromEnv = env['AGENTS_MACHINE_DIR']
  if (fromEnv) {
    return fromEnv
  }

  return join(root, 'machine')
}
