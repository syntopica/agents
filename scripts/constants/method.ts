import { detectExecutor } from '../detectors/detectExecutor'
import { skillDirs } from './skillDirs'

export const method = detectExecutor(skillDirs[0] ?? '')
