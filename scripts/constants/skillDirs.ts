import { listSkillDirs } from '../lib/skills/loaders/listSkillDirs'
import { SKILLS_DIR } from './SKILLS_DIR'

export const skillDirs = await listSkillDirs(SKILLS_DIR)
