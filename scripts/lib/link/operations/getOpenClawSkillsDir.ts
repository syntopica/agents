import path from 'node:path'
import { getOpenClawRootDir } from './getOpenClawRootDir'

export const getOpenClawSkillsDir = () =>
  path.join(getOpenClawRootDir() ?? '.', 'skills')
