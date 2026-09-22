import path from 'node:path'
import { HOME } from './HOME'

export const CODEX_HOME =
  process.env['CODEX_HOME']?.trim() ?? path.join(HOME, '.codex')
