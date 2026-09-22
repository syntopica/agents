import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Find hooks whose linked copy has drifted from source.
 *
 * hooks:link copies files into ~/.agents/hooks, so editing src/hooks changes
 * nothing live until the next build and link. Without this check the test suite
 * would pass against the repo copy while a stale script keeps running - the same
 * silent-divergence failure the hook tests exist to prevent.
 *
 * @returns {string[]} - Relative paths that differ between src and the linked
 *   copy, or are missing from it. Empty when in sync, or when nothing is linked.
 */
export const findStaleLinkedHooks = (): string[] => {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  )
  const source = path.join(repoRoot, 'src/hooks')
  const linked = path.join(process.env['HOME'] ?? '', '.agents/hooks')
  if (!existsSync(linked)) return []

  const walk = (dir: string, prefix = ''): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry)
      const rel = prefix ? path.join(prefix, entry) : entry
      if (statSync(full).isDirectory())
        return entry === '__pycache__' ? [] : walk(full, rel)
      return [rel]
    })

  return walk(source).filter((rel) => {
    const linkedFile = path.join(linked, rel)
    if (!existsSync(linkedFile)) return true
    return (
      readFileSync(path.join(source, rel), 'utf8') !==
      readFileSync(linkedFile, 'utf8')
    )
  })
}
