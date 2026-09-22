export interface PluginManifest {
  name: string
  version: string
  description: string
  author: { name: string; url?: string }
  repository?: { type: string; url: string }
  homepage?: string
  license?: string
  keywords?: string[]
  hooks?: string
}
