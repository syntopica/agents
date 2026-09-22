import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { guidanceDoctor } from './guidanceDoctor'
import { sha256Text } from './sha256Text'

void test('doctor verifies accepted hashes, invariants, and rendered guidance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-doctor-'))
  const home = join(root, 'home')
  const canonicalDir = join(root, 'canonical')
  const stateDir = join(root, 'state')
  await Promise.all([
    mkdir(join(home, '.claude'), { recursive: true }),
    mkdir(join(home, '.codex'), { recursive: true }),
    mkdir(canonicalDir),
    mkdir(stateDir),
  ])
  const documents = {
    shared: 'Required invariant.\n',
    claudeOverlay: 'Claude overlay.\n',
    codexOverlay: 'Codex overlay.\n',
    claudeDocument: 'Required invariant.\n',
    codexDocument: 'Required invariant.\n',
  }
  await Promise.all([
    writeFile(join(canonicalDir, 'shared.md'), documents.shared),
    writeFile(join(canonicalDir, 'claude-overlay.md'), documents.claudeOverlay),
    writeFile(join(canonicalDir, 'codex-overlay.md'), documents.codexOverlay),
    writeFile(join(home, '.claude', 'CLAUDE.md'), documents.claudeDocument),
    writeFile(join(home, '.codex', 'AGENTS.md'), documents.codexDocument),
    writeFile(
      join(canonicalDir, 'policy.json'),
      JSON.stringify({
        version: 1,
        requiredInvariants: ['Required invariant.'],
        officialDocumentationOrigins: {
          claude: ['https://docs.anthropic.com'],
          codex: ['https://developers.openai.com'],
        },
        maxOutputBytes: 20_000,
        agentCommand: ['/usr/bin/true'],
        timeoutMs: 5_000,
      }),
    ),
    writeFile(
      join(stateDir, 'accepted.json'),
      JSON.stringify({
        runId: 'accepted-run',
        acceptedAt: new Date().toISOString(),
        inputHashes: [{ path: 'canonical/shared.md', sha256: 'a'.repeat(64) }],
        outputHashes: Object.fromEntries(
          Object.entries(documents).map(([name, content]) => [
            name,
            sha256Text(content),
          ]),
        ),
      }),
    ),
  ])

  assert.deepEqual(await guidanceDoctor({ home, canonicalDir, stateDir }), {
    ok: true,
    findings: [],
  })

  await writeFile(join(home, '.codex', 'AGENTS.md'), 'drifted\n')
  const drifted = await guidanceDoctor({ home, canonicalDir, stateDir })
  assert.equal(drifted.ok, false)
  assert.match(
    drifted.findings.join('\n'),
    /guidance drift detected: codexDocument/u,
  )
  assert.match(
    drifted.findings.join('\n'),
    /required invariant missing from codexDocument/u,
  )
})

void test('doctor rejects malformed accepted state', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-doctor-invalid-'))
  const home = join(root, 'home')
  const canonicalDir = join(root, 'canonical')
  const stateDir = join(root, 'state')
  await Promise.all([mkdir(home), mkdir(canonicalDir), mkdir(stateDir)])
  await writeFile(join(stateDir, 'accepted.json'), '{}')
  const result = await guidanceDoctor({ home, canonicalDir, stateDir })
  assert.equal(result.ok, false)
  assert.match(result.findings.join('\n'), /accepted guidance state/u)
})
