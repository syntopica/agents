import type { McpManifest } from './McpManifest'

export type ParseResult =
  { ok: true; manifest: McpManifest } | { ok: false; errors: string[] }
