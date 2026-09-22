import { lstat, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const hasSameCapabilityContent = async (
  source: string,
  target: string,
): Promise<boolean> => {
  try {
    const [sourceStat, targetStat] = await Promise.all([
      lstat(source),
      lstat(target),
    ])
    if (sourceStat.isDirectory() !== targetStat.isDirectory()) return false
    if (!sourceStat.isDirectory()) {
      const [sourceBytes, targetBytes] = await Promise.all([
        readFile(source),
        readFile(target),
      ])
      return sourceBytes.equals(targetBytes)
    }
    const [sourceEntries, targetEntries] = await Promise.all([
      readdir(source),
      readdir(target),
    ])
    const sortedSource = sourceEntries.toSorted((left, right) =>
      left.localeCompare(right),
    )
    const sortedTarget = targetEntries.toSorted((left, right) =>
      left.localeCompare(right),
    )
    if (JSON.stringify(sortedSource) !== JSON.stringify(sortedTarget))
      return false
    const children = await Promise.all(
      sortedSource.map((entry) =>
        hasSameCapabilityContent(join(source, entry), join(target, entry)),
      ),
    )
    return children.every(Boolean)
  } catch {
    return false
  }
}
