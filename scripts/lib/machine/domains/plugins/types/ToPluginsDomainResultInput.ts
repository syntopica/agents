import type { PluginsManifestParseResult } from './PluginsManifestParseResult'
import type { PluginsState } from './PluginsState'

export interface ToPluginsDomainResultInput {
  parsed: PluginsManifestParseResult | undefined
  state: PluginsState
}
