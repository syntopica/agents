import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { createGuidanceProposalFixture } from './fixtures/createGuidanceProposalFixture'
import { pathContainsPath } from './pathContainsPath'
import { resolveGuidanceProposalOutput } from './resolveGuidanceProposalOutput'

void test('path containment distinguishes parent traversal from dot-prefixed children', () => {
  for (const child of ['', 'child/file', '..cache/file', '.../file']) {
    assert.equal(
      pathContainsPath('/protected', join('/protected', child)),
      true,
    )
  }
  for (const outside of ['/', '/sibling', '/protected-sibling/file']) {
    assert.equal(pathContainsPath('/protected', outside), false)
  }
})

void test('proposals cannot enter a protected directory through a dot-prefixed child', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const directory = join(fixture.options.canonicalDir, '..cache')
  await mkdir(directory, { mode: 0o700 })
  await assert.rejects(
    resolveGuidanceProposalOutput({
      ...fixture.options,
      proposalOutput: join(directory, 'proposal.json'),
    }),
    /protected guidance paths/u,
  )
})
