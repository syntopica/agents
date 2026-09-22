import { join } from 'node:path'
import { VENV_BIN } from './VENV_BIN'

export const VENV_CLI = join(
  VENV_BIN,
  process.platform === 'win32' ? 'agentskills.exe' : 'agentskills',
)
