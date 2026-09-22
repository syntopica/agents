import { isSecretReference } from '../../../secrets/isSecretReference'
import type { McpCaptureRefusal } from '../types/McpCaptureRefusal'
import type { McpValue } from '../types/McpValue'

export const toCapturedValues = ({
  server,
  field,
  live,
  declared,
  refused,
}: {
  server: string
  field: 'env' | 'headers'
  live: Record<string, unknown>
  declared: Record<string, McpValue> | undefined
  refused: McpCaptureRefusal[]
}): Record<string, McpValue> => {
  const captured: Record<string, McpValue> = {}

  for (const key of Object.keys(live).toSorted((left, right) =>
    left.localeCompare(right),
  )) {
    const reference = declared?.[key]

    if (reference !== undefined && isSecretReference(reference)) {
      captured[key] = reference
      continue
    }

    refused.push({
      server,
      field: `${field}.${key}`,
      reason:
        'no environment reference is declared for this key in the tracked manifest',
    })
  }

  return captured
}
