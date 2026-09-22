import path from 'node:path'
import { VENV_DIR } from './VENV_DIR'

export const VENV_BIN = path.join(
  VENV_DIR,
  process.platform === 'win32' ? 'Scripts' : 'bin',
)
