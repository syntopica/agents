import { runToPrompt } from '../runners/runToPrompt'
import { method } from './method'
import { skillDirs } from './skillDirs'

export const result = runToPrompt(skillDirs, method as string)
