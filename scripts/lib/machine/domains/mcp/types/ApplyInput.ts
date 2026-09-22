import type { McpManifest } from './McpManifest'
import type { McpTarget } from './McpTarget'

export interface ApplyInput {
  manifest: McpManifest
  paths: Record<McpTarget, string>
  owned: Record<McpTarget, string[]>
  env: NodeJS.ProcessEnv
}
