import { constants } from 'node:fs'
import { chmod, copyFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { CODEX_DATABASES } from './constants/CODEX_DATABASES'
import { hashFile } from './hashFile'
import { listDatabaseFamily } from './listDatabaseFamily'
import type { CodexSnapshotOptions } from './types/CodexSnapshotOptions'
import type { CodexSnapshotResult } from './types/CodexSnapshotResult'
import type { SnapshotManifestEntry } from './types/SnapshotManifestEntry'

export const createCodexSnapshot = async (
  options: CodexSnapshotOptions,
): Promise<CodexSnapshotResult> => {
  const snapshotDir = join(options.backupsDir, options.runId)
  const filesDir = join(snapshotDir, 'files')
  await mkdir(options.backupsDir, { recursive: true, mode: 0o700 })
  await mkdir(snapshotDir, { mode: 0o700 })
  await mkdir(filesDir, { mode: 0o700 })

  const databaseNames = options.databaseNames ?? CODEX_DATABASES
  const families = await Promise.all(
    databaseNames.map((name) =>
      listDatabaseFamily(join(options.codexDir, name)),
    ),
  )
  const sourcePaths = families
    .flat()
    .toSorted((left, right) => left.localeCompare(right))
  const entries: SnapshotManifestEntry[] = []

  for (const sourcePath of sourcePaths) {
    const sourceRelativePath = relative(options.codexDir, sourcePath)
    const destinationPath = join(filesDir, sourceRelativePath)
    const before = await stat(sourcePath)
    await mkdir(dirname(destinationPath), { recursive: true, mode: 0o700 })
    await copyFile(sourcePath, destinationPath, constants.COPYFILE_EXCL)
    await options.onFileCopied?.(sourcePath)
    const after = await stat(sourcePath)
    if (before.size !== after.size) {
      throw new Error(`${sourceRelativePath} changed while snapshotting`)
    }

    const [sourceHash, destinationHash] = await Promise.all([
      hashFile(sourcePath),
      hashFile(destinationPath),
    ])
    if (sourceHash !== destinationHash) {
      throw new Error(`${sourceRelativePath} changed while snapshotting`)
    }
    await chmod(destinationPath, 0o400)
    entries.push({
      relativePath: sourceRelativePath,
      bytes: before.size,
      sha256: destinationHash,
      mode: before.mode & 0o777,
    })
  }

  const manifest = {
    version: 1 as const,
    createdAt: new Date().toISOString(),
    entries,
  }
  const manifestPath = join(snapshotDir, 'manifest.json')
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  })
  await chmod(manifestPath, 0o400)
  return { snapshotDir, manifest }
}
