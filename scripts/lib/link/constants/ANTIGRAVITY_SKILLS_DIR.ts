import os from 'node:os'
import path from 'node:path'

export const ANTIGRAVITY_SKILLS_DIR = path.join(
  os.homedir(),
  '.gemini',
  'config',
  'skills',
)
