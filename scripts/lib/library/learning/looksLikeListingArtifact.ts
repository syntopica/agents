/**
 * A catalogue render mentions every skill once per rollout, so its entries sit
 * near the top of the distribution at identical values - measured 2026-08-24 on
 * 4,144 Codex rollouts: 17 unrelated skills at exactly 892, 8 more at 911. Real
 * usage is a power-law tail that repeats only small counts, so the floor is
 * relative to the busiest skill rather than absolute.
 */
export const looksLikeListingArtifact = (counts: Record<string, number>) => {
  const values = Object.values(counts).filter((count) => count > 1)

  if (values.length < 10) {
    return false
  }

  const floor = Math.max(...values) / 10
  const buckets: Record<number, number> = {}

  for (const value of values.filter((count) => count >= floor)) {
    buckets[value] = (buckets[value] ?? 0) + 1
  }

  return Math.max(0, ...Object.values(buckets)) >= 10
}
