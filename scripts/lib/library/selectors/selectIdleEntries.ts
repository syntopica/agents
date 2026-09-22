import { daysBetween } from '../daysBetween'
import { isFannedOut } from '../isFannedOut'
import type { SelectIdleEntriesInput } from '../types/SelectIdleEntriesInput'

export const selectIdleEntries = ({
  manifest,
  invocations,
  target,
  authoredSource,
  today,
  idleDays,
}: SelectIdleEntriesInput) =>
  Object.entries(manifest.entries)
    .filter(([name, entry]) => {
      if (!isFannedOut(entry, target)) {
        return false
      }

      if (entry.source === authoredSource) {
        return false
      }

      if (
        entry.decidedAt === undefined ||
        daysBetween(entry.decidedAt, today) < idleDays
      ) {
        return false
      }

      return (invocations[name] ?? 0) === 0
    })
    .map(([name]) => name)
