import { parseAcceptedGuidanceState } from './parseAcceptedGuidanceState'
import { renderGuidanceDocument } from './renderGuidanceDocument'
import type { GuidanceSources } from './types/GuidanceSources'

// A live document still equal to its accepted render carries no local edit.
// Once newer canonical guidance is published, its old text is not a source:
// handing it to the reconciler lets the union re-add what the publication removed.
// Hashes stay those of the files on disk, so input validation is unchanged.
export const toPublishedPromptSources = (
  sources: GuidanceSources,
  acceptPublished: boolean,
): GuidanceSources => {
  if (!acceptPublished) return sources
  let parsed: ReturnType<typeof parseAcceptedGuidanceState>
  try {
    parsed = parseAcceptedGuidanceState(
      JSON.parse(sources.values['state/accepted.json'] ?? '') as unknown,
    )
  } catch {
    return sources
  }
  if (!parsed.ok) return sources
  const outputs = parsed.state.outputHashes
  const values = { ...sources.values }
  const shared = values['canonical/shared.md'] ?? ''
  const targets = [
    ['live/claude/CLAUDE.md', 'claudeDocument', 'canonical/claude-overlay.md'],
    ['live/codex/AGENTS.md', 'codexDocument', 'canonical/codex-overlay.md'],
  ] as const
  for (const [livePath, outputName, overlayPath] of targets) {
    if (sources.hashes[livePath] !== outputs[outputName]) continue
    values[livePath] = renderGuidanceDocument(shared, values[overlayPath] ?? '')
  }
  return { values, hashes: sources.hashes }
}
