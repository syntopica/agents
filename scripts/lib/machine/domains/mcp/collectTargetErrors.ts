import { isMcpTarget } from './isMcpTarget'

export const collectTargetErrors = (
  name: string,
  targets: unknown,
  errors: string[],
) => {
  if (!Array.isArray(targets) || targets.length === 0) {
    errors.push(`${name}: targets must be a non-empty array`)
    return
  }

  for (const target of targets) {
    if (!isMcpTarget(target)) {
      errors.push(`${name}: unknown target ${String(target)}`)
    }
  }
}
