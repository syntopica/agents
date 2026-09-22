import path from 'node:path'
import { VENV_BIN } from './VENV_BIN'

export const VENV_VALIDATOR = path.join(
  VENV_BIN,
  process.platform === 'win32' ? 'agentskills.exe' : 'agentskills',
)
