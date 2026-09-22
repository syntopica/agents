import type { CurationManifest } from '../types/CurationManifest'

export const formatSeedReport = (
  manifest: CurationManifest,
  asJson: boolean,
) => {
  if (asJson) {
    return JSON.stringify(manifest, null, 2)
  }

  const counts: Record<string, number> = {}
  for (const entry of Object.values(manifest.entries)) {
    counts[entry.state] = (counts[entry.state] ?? 0) + 1
  }

  const lines = [
    `seeded ${String(Object.keys(manifest.entries).length)} entries`,
  ]
  for (const [state, count] of Object.entries(counts).toSorted(
    (left, right) => right[1] - left[1],
  )) {
    lines.push(`  ${state.padEnd(10)} ${String(count)}`)
  }

  return lines.join('\n')
}
