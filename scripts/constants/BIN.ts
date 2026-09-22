import { join } from 'node:path'
import { VENV_DIR } from './VENV_DIR'

export const BIN = join(
  VENV_DIR,
  process.platform === 'win32' ? 'Scripts' : 'bin',
)
