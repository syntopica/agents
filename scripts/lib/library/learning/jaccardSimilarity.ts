export const jaccardSimilarity = (left: string[], right: string[]) => {
  const leftSet = new Set(left)
  const rightSet = new Set(right)

  if (leftSet.size === 0 && rightSet.size === 0) {
    return 0
  }

  let shared = 0
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      shared++
    }
  }

  return shared / (leftSet.size + rightSet.size - shared)
}
