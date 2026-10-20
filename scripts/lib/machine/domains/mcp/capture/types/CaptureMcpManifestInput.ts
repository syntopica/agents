import type { McpManifest } from '../../types/McpManifest'
import type { McpState } from '../../types/McpState'

export interface CaptureMcpManifestInput {
  state: McpState
  declared: McpManifest | undefined
}
