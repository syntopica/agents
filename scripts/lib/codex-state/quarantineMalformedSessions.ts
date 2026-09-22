import { isAbsolute, join, normalize, relative, sep } from 'node:path'
import { appendQuarantineManifest } from './appendQuarantineManifest'
import { isCodexActive } from './isCodexActive'
import { quarantineFile } from './quarantineFile'
import type { QuarantineResult } from './types/QuarantineResult'
import type { SessionQuarantineOptions } from './types/SessionQuarantineOptions'

export const quarantineMalformedSessions = async (
  options: SessionQuarantineOptions,
): Promise<QuarantineResult> => {
  const activity = await isCodexActive(options.codexDir, options.processTable)
  if (activity.active)
    return { status: 'blocked', entries: [], reasons: activity.reasons }
  const sessionsDir = join(options.codexDir, 'sessions')
  const malformed = options.findings.filter(
    ({ status }) => status === 'malformed',
  )
  const entries = []
  for (const finding of malformed) {
    const sessionRelativePath = normalize(relative(sessionsDir, finding.path))
    if (
      isAbsolute(sessionRelativePath) ||
      sessionRelativePath === '..' ||
      sessionRelativePath.startsWith(`..${sep}`)
    ) {
      throw new Error(
        'malformed session is outside the active sessions directory',
      )
    }
    entries.push(
      await quarantineFile({
        sourcePath: finding.path,
        codexDir: options.codexDir,
        snapshotDir: options.snapshotDir,
      }),
    )
  }
  await appendQuarantineManifest(options.snapshotDir, entries)
  return { status: 'quarantined', entries, reasons: [] }
}
