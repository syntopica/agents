import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sha256Text } from './sha256Text'
import { toPublishedPromptSources } from './toPublishedPromptSources'
import type { GuidanceSources } from './types/GuidanceSources'

void test('published prompt sources replace only unedited live renders', () => {
  const createSources = (claudeLive: string): GuidanceSources => {
    const values: Record<string, string> = {
      'canonical/shared.md': 'Shared.\n',
      'canonical/claude-overlay.md': 'New Claude overlay.\n',
      'canonical/codex-overlay.md': 'New Codex overlay.\n',
      'live/claude/CLAUDE.md': claudeLive,
      'live/codex/AGENTS.md': 'Shared.\n\nOld Codex overlay.\n',
    }
    values['state/accepted.json'] = JSON.stringify({
      runId: 'accepted-run',
      acceptedAt: '2026-11-12T00:00:00.000Z',
      inputHashes: [
        { path: 'canonical/shared.md', sha256: sha256Text('Shared.\n') },
      ],
      outputHashes: {
        shared: sha256Text('Shared.\n'),
        claudeOverlay: sha256Text('Old Claude overlay.\n'),
        codexOverlay: sha256Text('Old Codex overlay.\n'),
        claudeDocument: sha256Text('Shared.\n\nOld Claude overlay.\n'),
        codexDocument: sha256Text('Shared.\n\nOld Codex overlay.\n'),
      },
    })
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
  const sources = createSources('Shared.\n\nOld Claude overlay.\nLocal edit.\n')
  const prompt = toPublishedPromptSources(sources, true)
  assert.equal(
    prompt.values['live/claude/CLAUDE.md'],
    'Shared.\n\nOld Claude overlay.\nLocal edit.\n',
  )
  assert.equal(
    prompt.values['live/codex/AGENTS.md'],
    'Shared.\n\nNew Codex overlay.\n',
  )
  assert.deepEqual(prompt.hashes, sources.hashes)
  assert.equal(toPublishedPromptSources(sources, false), sources)
})
