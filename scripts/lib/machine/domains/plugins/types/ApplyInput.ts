import type { CommandRunner } from '../../../exec/types/CommandRunner'
import type { PluginChange } from './PluginChange'
import type { PluginsPaths } from './PluginsPaths'

export interface ApplyInput {
  changes: PluginChange[]
  paths: PluginsPaths
  run: CommandRunner
}
