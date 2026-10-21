import assert from 'node:assert/strict'
import {
  access,
  chmod,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { assertGuidanceInputsUnchanged } from './assertGuidanceInputsUnchanged'
import { assertGuidanceProposalOutputUnchanged } from './assertGuidanceProposalOutputUnchanged'
import { collectGuidanceSources } from './collectGuidanceSources'
import { createGuidanceProposalFixture } from './fixtures/createGuidanceProposalFixture'
import { guidanceRollback } from './guidanceRollback'
import { guidanceSync } from './guidanceSync'
import { resolveGuidanceProposalOutput } from './resolveGuidanceProposalOutput'
import { sha256Text } from './sha256Text'
import type { GuidanceProposal } from './types/GuidanceProposal'

void test('proposal output is a private reviewable dry run and exact reviewed bytes apply without agent', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const before = await collectGuidanceSources(fixture.options)
  const generated = await guidanceSync({
    ...fixture.options,
    proposalOutput: fixture.proposalOutput,
  })
  assert.equal(generated.ok, true, generated.errors.join('; '))
  assert.equal(generated.applied, false)
  assert.ok(generated.proposal)
  const text = await readFile(fixture.proposalOutput, 'utf8')
  assert.equal(generated.proposal.sha256, sha256Text(text))
  assert.equal((await stat(fixture.proposalOutput)).mode & 0o777, 0o600)
  assert.deepEqual(await collectGuidanceSources(fixture.options), before)
  await assert.rejects(access(fixture.options.stateDir), { code: 'ENOENT' })
  assert.ok(
    !JSON.stringify(generated).includes(fixture.result.codexOverlay.trim()),
  )
  await rm(fixture.agentPath)
  const applied = await guidanceSync({
    ...fixture.options,
    applyProposal: fixture.proposalOutput,
    proposalSha256: generated.proposal.sha256,
  })
  assert.equal(applied.ok, true, applied.errors.join('; '))
  assert.equal(applied.applied, true)
  assert.equal(
    await readFile(join(fixture.options.home, '.codex', 'AGENTS.md'), 'utf8'),
    fixture.result.codexDocument,
  )
  await access(join(applied.snapshotDir, 'complete'))
  const replay = await guidanceSync({
    ...fixture.options,
    applyProposal: fixture.proposalOutput,
    proposalSha256: generated.proposal.sha256,
  })
  assert.equal(replay.ok, false)
  assert.match(replay.errors.join('; '), /input hashes/u)
  const rollback = await guidanceRollback(fixture.options)
  assert.equal(rollback.ok, true)
  assert.deepEqual(await collectGuidanceSources(fixture.options), before)
})

void test('tampering, source drift and policy drift reject reviewed proposals without snapshots', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const generated = await guidanceSync({
    ...fixture.options,
    proposalOutput: fixture.proposalOutput,
  })
  assert.equal(generated.ok, true)
  assert.ok(generated.proposal)
  const original = await readFile(fixture.proposalOutput, 'utf8')
  const apply = {
    ...fixture.options,
    applyProposal: fixture.proposalOutput,
    proposalSha256: generated.proposal.sha256,
  }
  await writeFile(fixture.proposalOutput, `${original} `)
  assert.match((await guidanceSync(apply)).errors.join('; '), /SHA256/u)
  await writeFile(fixture.proposalOutput, original)
  const live = join(fixture.options.home, '.codex', 'AGENTS.md')
  const liveBefore = await readFile(live, 'utf8')
  await writeFile(live, `${liveBefore}Owner edit.\n`)
  assert.match((await guidanceSync(apply)).errors.join('; '), /input hashes/u)
  assert.equal(await readFile(live, 'utf8'), `${liveBefore}Owner edit.\n`)
  await writeFile(live, liveBefore)
  const policy = await readFile(fixture.policyPath, 'utf8')
  await writeFile(fixture.policyPath, `${policy}\n`)
  assert.match(
    (await guidanceSync(apply)).errors.join('; '),
    /policy no longer matches/u,
  )
  await assert.rejects(access(join(fixture.options.stateDir, 'runs')), {
    code: 'ENOENT',
  })
  await assert.rejects(
    access(join(fixture.options.stateDir, 'accepted.json')),
    { code: 'ENOENT' },
  )
})

void test('stale, future, changed-target and invalid-evidence proposals fail full revalidation', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const generated = await guidanceSync({
    ...fixture.options,
    proposalOutput: fixture.proposalOutput,
  })
  assert.equal(generated.ok, true)
  const original = JSON.parse(
    await readFile(fixture.proposalOutput, 'utf8'),
  ) as GuidanceProposal
  for (const mutation of [
    'stale',
    'future',
    'context',
    'evidence',
    'invariant',
    'origin',
    'sensitive',
  ] as const) {
    const proposal = structuredClone(original)
    if (mutation === 'stale')
      proposal.startedAt = new Date(Date.now() - 90_000_000).toISOString()
    if (mutation === 'future')
      proposal.endedAt = new Date(Date.now() + 60_000).toISOString()
    if (mutation === 'context') proposal.context['home'] = '/different-target'
    if (mutation === 'evidence') {
      assert.ok(proposal.result.documentation[0])
      proposal.result.documentation[0].retrievedAt = new Date(0).toISOString()
    }
    if (mutation === 'invariant')
      proposal.result.shared = 'Required invariant omitted.\n'
    if (mutation === 'origin') {
      assert.ok(proposal.result.documentation[0])
      proposal.result.documentation[0].url = 'https://untrusted.example/docs'
    }
    if (mutation === 'sensitive')
      proposal.result.codexOverlay =
        '{"access_token":"fixture-sensitive-material"}'
    const text = JSON.stringify(proposal)
    await writeFile(fixture.proposalOutput, text)
    const report = await guidanceSync({
      ...fixture.options,
      applyProposal: fixture.proposalOutput,
      proposalSha256: sha256Text(text),
    })
    assert.equal(report.ok, false, mutation)
    assert.equal(report.applied, false)
    await assert.rejects(access(join(fixture.options.stateDir, 'runs')), {
      code: 'ENOENT',
    })
  }
})

void test('final source recheck rejects edits after proposal validation before any snapshot', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const sources = await collectGuidanceSources(fixture.options)
  const policySha256 = sha256Text(await readFile(fixture.policyPath, 'utf8'))
  await writeFile(
    join(fixture.options.canonicalDir, 'shared.md'),
    'Concurrent edit.\n',
  )
  await assert.rejects(
    assertGuidanceInputsUnchanged(
      fixture.options,
      sources.hashes,
      policySha256,
    ),
    /sources changed/u,
  )
  await assert.rejects(access(fixture.options.stateDir), { code: 'ENOENT' })
})

void test('proposal input refuses symlinks and nonprivate files before any apply', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const generated = await guidanceSync({
    ...fixture.options,
    proposalOutput: fixture.proposalOutput,
  })
  assert.equal(generated.ok, true)
  assert.ok(generated.proposal)
  const alias = join(fixture.root, 'proposal-alias.json')
  await symlink(fixture.proposalOutput, alias)
  const flags = {
    ...fixture.options,
    proposalSha256: generated.proposal.sha256,
  }
  assert.equal(
    (await guidanceSync({ ...flags, applyProposal: alias })).ok,
    false,
  )
  await chmod(fixture.proposalOutput, 0o644)
  assert.match(
    (
      await guidanceSync({ ...flags, applyProposal: fixture.proposalOutput })
    ).errors.join('; '),
    /private regular file/u,
  )
  await assert.rejects(access(fixture.options.stateDir), { code: 'ENOENT' })
})

void test('output cannot overwrite, follow aliases into protected paths, or use a shared directory', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const before = await collectGuidanceSources(fixture.options)
  await writeFile(fixture.proposalOutput, 'Owner file.\n')
  assert.match(
    (
      await guidanceSync({
        ...fixture.options,
        proposalOutput: fixture.proposalOutput,
      })
    ).errors.join('; '),
    /already exists/u,
  )
  assert.equal(await readFile(fixture.proposalOutput, 'utf8'), 'Owner file.\n')
  await chmod(fixture.options.canonicalDir, 0o700)
  const alias = join(fixture.root, 'canonical-alias')
  await symlink(fixture.options.canonicalDir, alias)
  const protectedReport = await guidanceSync({
    ...fixture.options,
    proposalOutput: join(alias, 'new.json'),
  })
  assert.match(protectedReport.errors.join('; '), /protected/u)
  const shared = join(fixture.root, 'shared')
  const { mkdir } = await import('node:fs/promises')
  await mkdir(shared, { mode: 0o755 })
  assert.match(
    (
      await guidanceSync({
        ...fixture.options,
        proposalOutput: join(shared, 'new.json'),
      })
    ).errors.join('; '),
    /owner-private/u,
  )
  assert.deepEqual(await collectGuidanceSources(fixture.options), before)
  assert.ok(
    !(await readdir(fixture.root)).some((name) => name.startsWith('snapshot')),
  )
})

void test('mixed proposal modes and missing hashes fail before creating state', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  for (const flags of [
    { applyProposal: fixture.proposalOutput },
    { proposalSha256: 'a'.repeat(64) },
    {
      proposalOutput: fixture.proposalOutput,
      applyProposal: fixture.proposalOutput,
    },
    { proposalOutput: fixture.proposalOutput, acceptPublished: true },
    {
      applyProposal: fixture.proposalOutput,
      proposalSha256: 'a'.repeat(64),
      dryRun: true,
    },
  ]) {
    assert.equal(
      (await guidanceSync({ ...fixture.options, ...flags })).ok,
      false,
    )
    await assert.rejects(access(fixture.options.stateDir), { code: 'ENOENT' })
  }
})

void test('destination permissions and symlink targets are rechecked before exclusive proposal write', async (t) => {
  const fixture = await createGuidanceProposalFixture()
  t.after(() => rm(fixture.root, { recursive: true, force: true }))
  const { mkdir } = await import('node:fs/promises')
  const first = join(fixture.root, 'first-private')
  const second = join(fixture.root, 'second-private')
  const alias = join(fixture.root, 'output-alias')
  await mkdir(first, { mode: 0o700 })
  await mkdir(second, { mode: 0o700 })
  await symlink(first, alias)
  const options = {
    ...fixture.options,
    proposalOutput: join(alias, 'new.json'),
  }
  const expectedPath = await resolveGuidanceProposalOutput(options)
  await chmod(first, 0o755)
  await assert.rejects(
    assertGuidanceProposalOutputUnchanged(options, expectedPath),
    /owner-private/u,
  )
  await chmod(first, 0o700)
  await rm(alias)
  await symlink(second, alias)
  await assert.rejects(
    assertGuidanceProposalOutputUnchanged(options, expectedPath),
    /destination changed/u,
  )
  await assert.rejects(access(join(first, 'new.json')), { code: 'ENOENT' })
  await assert.rejects(access(join(second, 'new.json')), { code: 'ENOENT' })
})
