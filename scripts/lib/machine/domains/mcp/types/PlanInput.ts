import type { McpManifest } from './McpManifest'
import type { McpState } from './McpState'
import type { McpTarget } from './McpTarget'

export interface PlanInput {
  manifest: McpManifest
  state: McpState
  owned: Record<McpTarget, string[]>
  env: NodeJS.ProcessEnv
}
