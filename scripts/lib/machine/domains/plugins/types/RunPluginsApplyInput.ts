import type { CommandRunner } from '../../../exec/types/CommandRunner'
import type { PluginsManifestParseResult } from './PluginsManifestParseResult'
import type { PluginsPaths } from './PluginsPaths'

export interface RunPluginsApplyInput {
  parsed: PluginsManifestParseResult | undefined
  paths: PluginsPaths
  prune: boolean
  run: CommandRunner
}
