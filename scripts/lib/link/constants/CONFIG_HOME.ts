import path from 'node:path'
import { HOME } from './HOME'

export const CONFIG_HOME =
  process.env['XDG_CONFIG_HOME']?.trim() ?? path.join(HOME, '.config')
