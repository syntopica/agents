/**
 * Sums usage measured on several surfaces. Keys stay as measured; the caller
 * remaps them onto manifest keys afterwards, so a bare Codex skill name and a
 * Claude skill key that resolve to the same skill still land together.
 */
export const mergeInvocationCounts = (
  sources: Record<string, number>[],
): Record<string, number> => {
  const merged: Record<string, number> = {}

  for (const source of sources) {
    for (const [skill, count] of Object.entries(source)) {
      merged[skill] = (merged[skill] ?? 0) + count
    }
  }

  return merged
}
