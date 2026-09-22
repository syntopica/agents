import { ENTRYPOINTS } from '../constants/ENTRYPOINTS'
import { ROOT_FILE_TO_SEGMENT } from '../constants/ROOT_FILE_TO_SEGMENT'

export function groupByTopSegment<T extends { rel: string }>(items: T[]) {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const parts = item.rel.split('/')

    let seg: string
    if (parts.length === 1) {
      if (item.rel in ROOT_FILE_TO_SEGMENT)
        seg =
          ROOT_FILE_TO_SEGMENT[item.rel as keyof typeof ROOT_FILE_TO_SEGMENT]
      else if (ENTRYPOINTS.has(item.rel)) seg = 'entrypoints'
      else seg = 'misc'
    } else {
      seg = parts[0] ?? 'misc'
    }
    const arr = map[seg] ?? (map[seg] = [])
    arr.push(item)
  }

  for (const seg of Object.keys(map)) {
    map[seg]?.sort((a: T, b: T) => a.rel.localeCompare(b.rel))
  }

  return map
}
