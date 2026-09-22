import assert from 'node:assert/strict'
import test from 'node:test'
import { renderGuidanceDocument } from './renderGuidanceDocument'
import { resolveGuidanceFastPath } from './resolveGuidanceFastPath'
import { sha256Text } from './sha256Text'
import { toGuidanceInputHashes } from './toGuidanceInputHashes'
import type { GuidancePolicy } from './types/GuidancePolicy'
import type { GuidanceSources } from './types/GuidanceSources'

void test('guidance fast paths are deterministic and conflict-aware', () => {
  assert.equal(
    renderGuidanceDocument(
      'Shared.\n',
      'Render the shared guidance plus this overlay into the target.\n',
    ),
    'Shared.\n\nRender this document into the target.\n',
  )
  const policy: GuidancePolicy = {
    version: 1,
    requiredInvariants: ['Never expose credentials.'],
    officialDocumentationOrigins: { claude: [], codex: [] },
    maxOutputBytes: 20_000,
    agentCommand: ['/usr/bin/false'],
    timeoutMs: 1_000,
  }
  const createSources = (
    published = false,
    auxiliary = 'rules',
  ): GuidanceSources => {
    const old = {
      'canonical/shared.md': 'Never expose credentials.\n',
      'canonical/claude-overlay.md': 'Old Claude overlay.\n',
      'canonical/codex-overlay.md': 'Old Codex overlay.\n',
      'live/claude/CLAUDE.md':
        'Never expose credentials.\n\nOld Claude overlay.\n',
      'live/codex/AGENTS.md':
        'Never expose credentials.\n\nOld Codex overlay.\n',
      'generated/rules-inventory': 'rules',
      'state/accepted.json': '',
    }
    const oldHashes = Object.fromEntries(
      Object.entries(old).map(([path, value]) => [path, sha256Text(value)]),
    )
    const accepted = JSON.stringify({
      runId: 'accepted-run',
      acceptedAt: '2026-08-20T00:00:00.000Z',
      inputHashes: toGuidanceInputHashes(oldHashes),
      outputHashes: {
        shared: oldHashes['canonical/shared.md'],
        claudeOverlay: oldHashes['canonical/claude-overlay.md'],
        codexOverlay: oldHashes['canonical/codex-overlay.md'],
        claudeDocument: oldHashes['live/claude/CLAUDE.md'],
        codexDocument: oldHashes['live/codex/AGENTS.md'],
      },
    })
    const values = {
      ...old,
      'canonical/shared.md': published
        ? 'Never expose credentials.\nPublished guidance.\n'
        : old['canonical/shared.md'],
      'generated/rules-inventory': auxiliary,
      'state/accepted.json': accepted,
    }
    return {
      values,
      hashes: Object.fromEntries(
        Object.entries(values).map(([path, value]) => [
          path,
          sha256Text(value),
        ]),
      ),
    }
  }
  assert.equal(
    resolveGuidanceFastPath({
      sources: createSources(),
      policy,
      acceptPublished: false,
    }).kind,
    'converged',
  )
  const resolved = resolveGuidanceFastPath({
    sources: createSources(true),
    policy,
    acceptPublished: true,
  })
  assert.equal(resolved.kind, 'adopt')
  assert.equal(
    resolved.result.claudeDocument,
    'Never expose credentials.\nPublished guidance.\n\nOld Claude overlay.\n',
  )
  assert.equal(
    resolveGuidanceFastPath({
      sources: createSources(true),
      policy,
      acceptPublished: false,
    }).kind,
    'reconcile',
  )
  assert.equal(
    resolveGuidanceFastPath({
      sources: createSources(true, 'changed rules'),
      policy,
      acceptPublished: true,
    }).kind,
    'reconcile',
  )
})
