import { join } from 'node:path'
import type { ResolveLibraryDirOptions } from './types/ResolveLibraryDirOptions'

export const resolveLibraryDir = ({
  flag,
  env,
  home,
}: ResolveLibraryDirOptions) => {
  if (flag) {
    return flag
  }

  const fromEnv = env['AGENTS_LIBRARY_DIR']
  if (fromEnv) {
    return fromEnv
  }

  return join(home, '.agents')
}
