import type { PluginEnablement } from './PluginEnablement'
import type { PluginProfile } from './PluginProfile'

export interface PluginManifestEntry {
  id: string
  marketplace: string
  scope: string
  version: string
  gitCommitSha?: string
  enablement: Record<PluginProfile, PluginEnablement>
}
