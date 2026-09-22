import type { McpCaptureRefusal } from './McpCaptureRefusal'
import type { McpManifest } from './McpManifest'

export interface McpCapture {
  manifest: McpManifest
  refused: McpCaptureRefusal[]
}
