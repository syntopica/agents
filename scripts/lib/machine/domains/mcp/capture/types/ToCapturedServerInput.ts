import type { LiveServer } from '../../types/LiveServer'
import type { McpCaptureRefusal } from '../../types/McpCaptureRefusal'
import type { McpServer } from '../../types/McpServer'
import type { McpTarget } from '../../types/McpTarget'

export interface ToCapturedServerInput {
  name: string
  targets: McpTarget[]
  live: LiveServer
  declared: McpServer | undefined
  refused: McpCaptureRefusal[]
}
