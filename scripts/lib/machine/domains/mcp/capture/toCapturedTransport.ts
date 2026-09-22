import type { LiveServer } from '../types/LiveServer'
import type { McpServer } from '../types/McpServer'

export const toCapturedTransport = (
  live: LiveServer,
): McpServer['transport'] => {
  if (live.type === 'sse') {
    return 'sse'
  }

  return live.url === undefined ? 'stdio' : 'http'
}
