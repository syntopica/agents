import assert from 'node:assert/strict'
import { access, open, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { createGuidanceProposalFixture } from './fixtures/createGuidanceProposalFixture'
import { guidanceProposalByteLimit } from './guidanceProposalByteLimit'
import { guidanceProposalContext } from './guidanceProposalContext'
import { guidanceSync } from './guidanceSync'
import { readBoundedGuidanceProposal } from './readBoundedGuidanceProposal'
import { sha256Text } from './sha256Text'
import type { GuidanceProposal } from './types/GuidanceProposal'
import { writeGuidanceProposal } from './writeGuidanceProposal'

void test('writer enforces the shared serialized boundary before creating any file', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const proposal: GuidanceProposal = {
    version: 1,
    startedAt: new Date(Date.now() - 1_000).toISOString(),
    endedAt: new Date().toISOString(),
    policySha256: sha256Text(await readFile(fixture.policyPath, 'utf8')),
    context: guidanceProposalContext(fixture.options),
    result: structuredClone(fixture.result),
  }
  proposal.result.warnings = ['']
  const limit = guidanceProposalByteLimit(1_024)
  const overhead = Buffer.byteLength(`${JSON.stringify(proposal, null, 2)}\n`)
  proposal.result.warnings = ['x'.repeat(limit - overhead)]
  const boundaryPath = join(fixture.root, 'boundary.json')
  const written = await writeGuidanceProposal(boundaryPath, proposal, 1_024)
  assert.equal(Buffer.byteLength(await readFile(boundaryPath, 'utf8')), limit)
  const handle = await open(boundaryPath, 'r')
  try {
    assert.equal(
      sha256Text(await readBoundedGuidanceProposal(handle, limit)),
      written.sha256,
    )
  } finally {
    await handle.close()
  }
  proposal.result.warnings.push('one extra item')
  const rejectedPath = join(fixture.root, 'too-large.json')
  await assert.rejects(
    writeGuidanceProposal(rejectedPath, proposal, 1_024),
    /serialized byte limit/u,
  )
  await assert.rejects(access(rejectedPath), { code: 'ENOENT' })
})

void test('bounded reader rejects file growth after its initial metadata check', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const file = join(fixture.root, 'growing.json')
  await writeFile(file, 'small')
  const handle = await open(file, 'r')
  try {
    assert.equal((await handle.stat()).size, 5)
    await writeFile(file, 'x'.repeat(10_000))
    await assert.rejects(
      readBoundedGuidanceProposal(handle, 32),
      /serialized byte limit/u,
    )
  } finally {
    await handle.close()
  }
})

void test('a generated result near the agent byte limit remains readable and applicable', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const result = structuredClone(fixture.result)
  const base = Buffer.byteLength(JSON.stringify(result))
  result.codexOverlay += 'x'.repeat(20_000 - base - 128)
  assert.ok(Buffer.byteLength(JSON.stringify(result)) > 19_000)
  await writeFile(
    fixture.agentPath,
    `const result=${JSON.stringify(result)};process.stdin.resume();process.stdin.on('end',()=>{result.documentation.forEach(item=>{item.retrievedAt=new Date().toISOString()});process.stdout.write(JSON.stringify(result))})`,
  )
  const generated = await guidanceSync({
    ...fixture.options,
    proposalOutput: fixture.proposalOutput,
  })
  assert.equal(generated.ok, true, generated.errors.join('; '))
  assert.ok(generated.proposal)
  await rm(fixture.agentPath)
  const applied = await guidanceSync({
    ...fixture.options,
    applyProposal: fixture.proposalOutput,
    proposalSha256: generated.proposal.sha256,
  })
  assert.equal(applied.ok, true, applied.errors.join('; '))
  assert.equal(
    await readFile(
      join(fixture.options.canonicalDir, 'codex-overlay.md'),
      'utf8',
    ),
    result.codexOverlay,
  )
})
