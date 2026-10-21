import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectGuidanceSources } from '../collectGuidanceSources'
import { toGuidanceInputHashes } from '../toGuidanceInputHashes'
import type { GuidanceSyncOptions } from '../types/GuidanceSyncOptions'
import type { ReconciliationResult } from '../types/ReconciliationResult'

export const createGuidanceProposalFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-proposal-'))
  const options: GuidanceSyncOptions = {
    home: join(root, 'home'),
    canonicalDir: join(root, 'canonical'),
    stateDir: join(root, 'state'),
    rulesInventoryPath: join(root, 'missing-inventory.md'),
  }
  await mkdir(join(options.home, '.claude'), { recursive: true })
  await mkdir(join(options.home, '.codex'), { recursive: true })
  await mkdir(options.canonicalDir)
  for (const name of ['shared.md', 'claude-overlay.md', 'codex-overlay.md'])
    await writeFile(
      join(options.canonicalDir, name),
      'Original canonical text.\n',
    )
  await writeFile(
    join(options.home, '.claude', 'CLAUDE.md'),
    'Original Claude instructions.\n',
  )
  await writeFile(
    join(options.home, '.codex', 'AGENTS.md'),
    'Original Codex instructions.\n',
  )
  const result: ReconciliationResult = {
    version: 1,
    inputHashes: toGuidanceInputHashes(
      (await collectGuidanceSources(options)).hashes,
    ),
    shared: 'Never expose credentials.\n',
    claudeOverlay: 'Reviewed Claude overlay.\n',
    codexOverlay: 'Reviewed Codex overlay.\n',
    claudeDocument: 'Never expose credentials.\n',
    codexDocument: 'Never expose credentials.\n',
    documentation: [
      {
        provider: 'claude',
        url: 'https://docs.anthropic.com/en/docs/claude-code',
        retrievedAt: new Date().toISOString(),
      },
      {
        provider: 'codex',
        url: 'https://developers.openai.com/codex',
        retrievedAt: new Date().toISOString(),
      },
    ],
    decisions: [],
    warnings: [],
    unresolvedLimitations: [],
  }
  const agentPath = join(root, 'agent.mjs')
  await writeFile(
    agentPath,
    `const result=${JSON.stringify(result)};process.stdin.resume();process.stdin.on('end',()=>{result.documentation.forEach(item=>{item.retrievedAt=new Date().toISOString()});process.stdout.write(JSON.stringify(result))})`,
  )
  const policyPath = join(options.canonicalDir, 'policy.json')
  await writeFile(
    policyPath,
    JSON.stringify({
      version: 1,
      requiredInvariants: ['Never expose credentials.'],
      officialDocumentationOrigins: {
        claude: ['https://docs.anthropic.com'],
        codex: ['https://developers.openai.com'],
      },
      maxOutputBytes: 20_000,
      agentCommand: [process.execPath, agentPath],
      timeoutMs: 5_000,
    }),
  )
  return {
    root,
    options,
    result,
    agentPath,
    policyPath,
    proposalOutput: join(root, 'review.json'),
  }
}
