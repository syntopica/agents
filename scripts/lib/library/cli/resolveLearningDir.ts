import { join } from 'node:path'
import type { ResolveLearningDirOptions } from './types/ResolveLearningDirOptions'

export const resolveLearningDir = ({
  flag,
  env,
  home,
}: ResolveLearningDirOptions) => {
  if (flag) {
    return flag
  }

  const fromEnv = env['AGENTS_LEARNING_DIR']
  if (fromEnv) {
    return fromEnv
  }

  return join(home, '.agents-learning')
}
