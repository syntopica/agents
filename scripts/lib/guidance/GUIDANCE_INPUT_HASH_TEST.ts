import assert from 'node:assert/strict'
import test from 'node:test'
import { validateReconciliationResult } from './validators/validateReconciliationResult'
import { validateReconciliationSchema } from './validators/validateReconciliationSchema'

void test('input hashes use a strict normalized array and match every source exactly', () => {
  const policy = {
    version: 1 as const,
    requiredInvariants: ['Never expose credentials.'],
    officialDocumentationOrigins: {
      claude: ['https://docs.anthropic.com'],
      codex: ['https://developers.openai.com'],
    },
    maxOutputBytes: 20_000,
    agentCommand: ['fake-agent'],
    timeoutMs: 5_000,
  }

  const result = {
    version: 1,
    inputHashes: [
      { path: 'canonical/shared.md', sha256: 'a'.repeat(64) },
      { path: 'canonical/codex-overlay.md', sha256: 'b'.repeat(64) },
    ],
    shared: 'Never expose credentials.\n',
    claudeOverlay: 'Claude.\n',
    codexOverlay: 'Codex.\n',
    claudeDocument: 'Never expose credentials.\n',
    codexDocument: 'Never expose credentials.\n',
    documentation: [
      {
        provider: 'claude' as const,
        url: 'https://docs.anthropic.com/en/docs/claude-code',
        retrievedAt: '2026-08-20T10:00:00.000Z',
      },
      {
        provider: 'codex' as const,
        url: 'https://developers.openai.com/codex',
        retrievedAt: '2026-08-20T10:00:00.000Z',
      },
    ],
    decisions: [],
    warnings: [],
    unresolvedLimitations: [],
  }

  const expectedHashes = {
    'canonical/shared.md': 'a'.repeat(64),
    'canonical/codex-overlay.md': 'b'.repeat(64),
  }

  const validated = validateReconciliationResult(
    result,
    policy,
    expectedHashes,
    new Date(0),
    new Date('2100-01-01T00:00:00.000Z'),
  )
  assert.equal(validated.ok, true)
  assert.deepEqual(
    validated.result.inputHashes.map(({ path }) => path),
    ['canonical/codex-overlay.md', 'canonical/shared.md'],
  )

  const cases = [
    {
      name: 'duplicate',
      inputHashes: [result.inputHashes[0], result.inputHashes[0]],
      expectedError: /duplicate paths/u,
    },
    {
      name: 'missing',
      inputHashes: [result.inputHashes[0]],
      expectedError: /do not match/u,
    },
    {
      name: 'extra',
      inputHashes: [
        ...result.inputHashes,
        { path: 'live/codex/AGENTS.md', sha256: 'c'.repeat(64) },
      ],
      expectedError: /do not match/u,
    },
    {
      name: 'stale',
      inputHashes: [
        { path: 'canonical/shared.md', sha256: 'd'.repeat(64) },
        result.inputHashes[1],
      ],
      expectedError: /do not match/u,
    },
  ]
  for (const fixture of cases) {
    const validated = validateReconciliationResult(
      { ...result, inputHashes: fixture.inputHashes },
      policy,
      expectedHashes,
      new Date(0),
      new Date('2100-01-01T00:00:00.000Z'),
    )
    assert.equal(
      validated.ok,
      false,
      `${fixture.name} input hashes must be rejected`,
    )
    assert.match(validated.errors.join('\n'), fixture.expectedError)
  }

  assert.equal(validateReconciliationSchema(result).length, 0)
  for (const inputHashes of [
    { 'canonical/shared.md': 'a'.repeat(64) },
    [{ path: 'canonical/shared.md' }],
    [{ path: 'canonical/shared.md', sha256: 'a'.repeat(64), unexpected: true }],
  ])
    assert.notEqual(
      validateReconciliationSchema({ ...result, inputHashes }).length,
      0,
      'invalid input hash shape must be rejected',
    )
})
