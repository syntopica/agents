import { jaccardSimilarity } from './jaccardSimilarity'
import { tokenizeProcedureName } from './tokenizeProcedureName'

export const canonicalizeProcedureNames = (
  names: string[],
): Record<string, string> => {
  const counts: Record<string, number> = {}
  for (const name of names) {
    const trimmed = name.trim().toLowerCase()
    if (trimmed !== '') {
      counts[trimmed] = (counts[trimmed] ?? 0) + 1
    }
  }

  const ordered = Object.entries(counts)
    .toSorted(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .map(([name]) => name)

  const clusters: { representative: string; tokens: string[] }[] = []
  const mapping: Record<string, string> = {}

  for (const name of ordered) {
    const tokens = tokenizeProcedureName(name)
    const home = clusters.find(
      (cluster) => jaccardSimilarity(cluster.tokens, tokens) >= 0.5,
    )

    if (home === undefined) {
      clusters.push({ representative: name, tokens })
      mapping[name] = name
    } else {
      mapping[name] = home.representative
    }
  }

  return mapping
}
