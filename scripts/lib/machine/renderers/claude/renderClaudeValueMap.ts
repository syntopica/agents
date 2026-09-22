import type { McpValue } from '../../domains/mcp/types/McpValue'
import { isSecretReference } from '../../secrets/isSecretReference'
import type { ResolvedMap } from './types/ResolvedMap'

export const renderClaudeValueMap = (
  source: Record<string, McpValue>,
  env: NodeJS.ProcessEnv,
): ResolvedMap => {
  const values: Record<string, string> = {}
  const missing: string[] = []

  for (const [key, value] of Object.entries(source)) {
    if (!isSecretReference(value)) {
      values[key] = value
      continue
    }

    if (env[value.from_env] === undefined || env[value.from_env] === '') {
      missing.push(value.from_env)
      continue
    }

    values[key] = '${' + value.from_env + '}'
  }

  return { values, missing }
}
