import type { McpServer } from './McpServer'

export interface McpManifest {
  servers: Record<string, McpServer>
}
