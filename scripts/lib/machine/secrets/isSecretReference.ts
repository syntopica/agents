import type { SecretReference } from './SecretReference'

export const isSecretReference = (value: unknown): value is SecretReference => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate['from_env'] === 'string'
}
