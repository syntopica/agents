import type { SecretReference } from './SecretReference'
import type { ResolvedReference } from './types/ResolvedReference'

export const resolveReference = (
  reference: SecretReference,
  env: NodeJS.ProcessEnv,
): ResolvedReference => {
  const value = env[reference.from_env]
  if (value) {
    return { resolved: true, value }
  }

  return { resolved: false, name: reference.from_env }
}
