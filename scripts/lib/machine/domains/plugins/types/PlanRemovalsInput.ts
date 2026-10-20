import type { PluginsManifestDocument } from './PluginsManifestDocument'
import type { PluginsState } from './PluginsState'

export interface PlanRemovalsInput {
  manifest: PluginsManifestDocument
  state: PluginsState
}
