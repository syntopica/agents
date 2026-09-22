import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GuidanceDocumentContents } from './types/GuidanceDocumentContents'

export const readGuidanceDocuments = async (options: {
  home: string
  canonicalDir: string
}): Promise<{ contents: GuidanceDocumentContents; findings: string[] }> => {
  const paths: Record<keyof GuidanceDocumentContents, string> = {
    shared: join(options.canonicalDir, 'shared.md'),
    claudeOverlay: join(options.canonicalDir, 'claude-overlay.md'),
    codexOverlay: join(options.canonicalDir, 'codex-overlay.md'),
    claudeDocument: join(options.home, '.claude', 'CLAUDE.md'),
    codexDocument: join(options.home, '.codex', 'AGENTS.md'),
  }
  const contents: GuidanceDocumentContents = {
    shared: undefined,
    claudeOverlay: undefined,
    codexOverlay: undefined,
    claudeDocument: undefined,
    codexDocument: undefined,
  }
  const findings: string[] = []
  for (const [name, path] of Object.entries(paths) as [
    keyof GuidanceDocumentContents,
    string,
  ][]) {
    try {
      contents[name] = await readFile(path, 'utf8')
    } catch {
      findings.push(
        `missing guidance document: ${path.replace(options.home, '~')}`,
      )
    }
  }
  return { contents, findings }
}
