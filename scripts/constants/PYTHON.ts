import { join } from 'node:path'
import { BIN } from './BIN'

export const PYTHON = join(
  BIN,
  process.platform === 'win32' ? 'python.exe' : 'python',
)
