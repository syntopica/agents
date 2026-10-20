import type { McpCaptureRefusal } from '../../types/McpCaptureRefusal'
import type { McpValue } from '../../types/McpValue'

export interface ToCapturedValuesInput {
  server: string
  field: 'env' | 'headers'
  live: Record<string, unknown>
  declared: Record<string, McpValue> | undefined
  refused: McpCaptureRefusal[]
}
