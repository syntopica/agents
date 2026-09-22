import type { McpManifest } from '../types/McpManifest'

export const createDeclaredContext7Manifest = (): McpManifest => ({
  servers: {
    context7: {
      targets: ['claude-personal'],
      transport: 'http',
      url: 'https://mcp.context7.com/mcp',
      headers: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
    },
  },
})
