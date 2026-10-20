import type { ToCapabilityMessagesResults } from './types/ToCapabilityMessagesResults'

/**
 * One line per capability target: why it was skipped, or how many paths moved.
 * A converged target contributes nothing.
 */
export const toCapabilityMessages = (
  results: ToCapabilityMessagesResults[],
): string[] =>
  results.flatMap(({ target, result }) => {
    if (result.status !== 'supported') {
      return [`skipped ${target.id}: ${result.status}`]
    }

    const changed = result.linked + result.copied

    return changed === 0
      ? []
      : [`updated ${String(changed)} paths for ${target.id}`]
  })
