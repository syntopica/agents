import type { PluginsManifestDocument } from './PluginsManifestDocument'

export type PluginsManifestParseResult =
  | { ok: true; manifest: PluginsManifestDocument }
  | { ok: false; errors: string[] }
