import type { CacheHygieneReport } from './CacheHygieneReport'
import type { PluginsManifest } from './PluginsManifest'

export interface PluginsCapture {
  manifest: PluginsManifest
  cache: CacheHygieneReport
}
