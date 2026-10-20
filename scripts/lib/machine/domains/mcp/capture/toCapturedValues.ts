import { isSecretReference } from '../../../secrets/isSecretReference'
import type { McpValue } from '../types/McpValue'
import type { ToCapturedValuesInput } from './types/ToCapturedValuesInput'

export const toCapturedValues = ({
  server,
  field,
  live,
  declared,
  refused,
}: ToCapturedValuesInput): Record<string, McpValue> => {
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
