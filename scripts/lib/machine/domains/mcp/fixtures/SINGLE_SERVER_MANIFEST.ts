import type { McpManifest } from '../types/McpManifest'

export const SINGLE_SERVER_MANIFEST: McpManifest = {
  servers: {
    serena: {
      targets: ['claude-personal'],
      transport: 'stdio',
      command: 'uvx',
    },
  },
}
