import type { PluginsManifestDocument } from './PluginsManifestDocument'
import type { PluginsState } from './PluginsState'

export interface PlanInput {
  manifest: PluginsManifestDocument
  state: PluginsState
}
