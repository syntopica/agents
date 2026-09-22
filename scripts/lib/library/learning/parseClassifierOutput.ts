import { firstJsonObject } from './firstJsonObject'

export const parseClassifierOutput = (raw: string) => {
  const block = firstJsonObject(raw)

  if (block === undefined) {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(block)
  } catch {
    return []
  }

  const items = (parsed as { requests?: unknown }).requests

  if (!Array.isArray(items)) {
    return []
  }

  const classified: { procedure: string; project?: string }[] = []

  for (const item of items) {
    if (typeof item !== 'object' || item === null) {
      continue
    }

    const record = item as Record<string, unknown>
    const procedure = record['procedure'] ?? record['recurring_shape']

    if (typeof procedure !== 'string') {
      continue
    }

    classified.push({
      procedure,
      ...(typeof record['project'] === 'string'
        ? { project: record['project'] }
        : {}),
    })
  }

  return classified
}
