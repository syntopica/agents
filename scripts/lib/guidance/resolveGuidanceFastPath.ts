import { collectGuidanceOutputErrors } from './collectGuidanceOutputErrors'
import { containsSensitiveGuidanceContent } from './containsSensitiveGuidanceContent'
import { parseAcceptedGuidanceState } from './parseAcceptedGuidanceState'
import { renderGuidanceDocument } from './renderGuidanceDocument'
import { sha256Text } from './sha256Text'
import { toGuidanceInputHashes } from './toGuidanceInputHashes'
import type { GuidanceFastPath } from './types/GuidanceFastPath'
import type { GuidanceOutputDocuments } from './types/GuidanceOutputDocuments'
import type { GuidancePolicy } from './types/GuidancePolicy'
import type { GuidanceSources } from './types/GuidanceSources'

export const resolveGuidanceFastPath = (options: {
  sources: GuidanceSources
  policy: GuidancePolicy
  acceptPublished: boolean
}): GuidanceFastPath => {
  const canonicalPaths = [
    'canonical/shared.md',
    'canonical/claude-overlay.md',
    'canonical/codex-overlay.md',
  ]
  const livePaths = ['live/claude/CLAUDE.md', 'live/codex/AGENTS.md']
  const volatilePaths = new Set([
    ...canonicalPaths,
    ...livePaths,
    'state/accepted.json',
  ])
  let parsed: ReturnType<typeof parseAcceptedGuidanceState>
  try {
    parsed = parseAcceptedGuidanceState(
      JSON.parse(
        options.sources.values['state/accepted.json'] ?? '',
      ) as unknown,
    )
  } catch {
    return { kind: 'reconcile' }
  }
  if (!parsed.ok) return { kind: 'reconcile' }
  const documents: GuidanceOutputDocuments = {
    shared: options.sources.values['canonical/shared.md'] ?? '',
    claudeOverlay: options.sources.values['canonical/claude-overlay.md'] ?? '',
    codexOverlay: options.sources.values['canonical/codex-overlay.md'] ?? '',
    claudeDocument: options.sources.values['live/claude/CLAUDE.md'] ?? '',
    codexDocument: options.sources.values['live/codex/AGENTS.md'] ?? '',
  }
  const currentOutputHashes = Object.fromEntries(
    Object.entries(documents).map(([name, content]) => [
      name,
      sha256Text(content),
    ]),
  ) as Record<keyof typeof documents, string>
  const outputNames = Object.keys(documents) as (keyof typeof documents)[]
  if (
    outputNames.every(
      (name) => currentOutputHashes[name] === parsed.state.outputHashes[name],
    )
  )
    return {
      kind: 'converged',
      warning: 'guidance already converged; reconciliation agent not run',
    }
  if (!options.acceptPublished) return { kind: 'reconcile' }
  if (
    currentOutputHashes.claudeDocument !==
      parsed.state.outputHashes.claudeDocument ||
    currentOutputHashes.codexDocument !==
      parsed.state.outputHashes.codexDocument
  )
    return { kind: 'reconcile' }
  const previousInputs = Object.fromEntries(
    parsed.state.inputHashes.map(({ path, sha256 }) => [path, sha256]),
  )
  const stablePaths = Object.keys(options.sources.hashes).filter(
    (path) => !volatilePaths.has(path),
  )
  const previousStablePaths = Object.keys(previousInputs).filter(
    (path) => !volatilePaths.has(path),
  )
  if (
    JSON.stringify(stablePaths.toSorted()) !==
      JSON.stringify(previousStablePaths.toSorted()) ||
    stablePaths.some(
      (path) => options.sources.hashes[path] !== previousInputs[path],
    )
  )
    return { kind: 'reconcile' }
  if (
    canonicalPaths.every((path, index) => {
      const name = ['shared', 'claudeOverlay', 'codexOverlay'][index] as
        'shared' | 'claudeOverlay' | 'codexOverlay'
      return options.sources.hashes[path] === parsed.state.outputHashes[name]
    })
  )
    return { kind: 'reconcile' }
  const adoptedDocuments: typeof documents = {
    ...documents,
    claudeDocument: renderGuidanceDocument(
      documents.shared,
      documents.claudeOverlay,
    ),
    codexDocument: renderGuidanceDocument(
      documents.shared,
      documents.codexOverlay,
    ),
  }
  if (
    containsSensitiveGuidanceContent(JSON.stringify(adoptedDocuments)) ||
    collectGuidanceOutputErrors(adoptedDocuments, options.policy).length > 0
  )
    return { kind: 'reconcile' }
  return {
    kind: 'adopt',
    result: {
      version: 1,
      inputHashes: toGuidanceInputHashes(options.sources.hashes),
      ...adoptedDocuments,
      documentation: [],
      decisions: [],
      warnings: [
        'adopted published canonical guidance without a semantic rewrite',
      ],
      unresolvedLimitations: [],
    },
  }
}
