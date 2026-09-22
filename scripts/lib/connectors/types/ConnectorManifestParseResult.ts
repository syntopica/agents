import type { ConnectorManifest } from './ConnectorManifest'

export type ConnectorManifestParseResult =
  { ok: true; manifest: ConnectorManifest } | { ok: false; errors: string[] }
