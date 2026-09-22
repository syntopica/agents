import { hasSameShape } from './hasSameShape'
import type { McpChange } from './types/McpChange'
import type { McpTarget } from './types/McpTarget'

export const planTarget = (
  target: McpTarget,
  desired: Record<string, unknown>,
  actual: Record<string, unknown>,
  ownedHere: string[],
) => {
  const changes: McpChange[] = []

  for (const [name, value] of Object.entries(desired)) {
    const existing = actual[name]

    if (existing === undefined) {
      changes.push({ target, name, operation: 'add' })
      continue
    }

    if (!hasSameShape(existing, value)) {
      changes.push({ target, name, operation: 'update' })
    }
  }

  for (const name of Object.keys(actual)) {
    if (!(name in desired) && ownedHere.includes(name)) {
      changes.push({ target, name, operation: 'remove' })
    }
  }

  return changes
}
