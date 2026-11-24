import assert from 'node:assert/strict'
import {
  lstat,
  mkdir,
  mkdtemp,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { PARKED_MANIFEST as manifest } from './fixtures/PARKED_MANIFEST'
import { pruneParkedLinks } from './pruneParkedLinks'

void test('prune removes only symlinks into the library tree of parked entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rocket-agents-prune-'))
  try {
    const skillsRoot = join(root, 'library', 'skills')
    const linkDir = join(root, 'home', 'skills')
    const outside = join(root, 'outside')
    await mkdir(join(skillsRoot, 'live'), { recursive: true })
    await mkdir(join(skillsRoot, 'shelved'), { recursive: true })
    await mkdir(join(skillsRoot, 'shelvedBundle', 'child'), { recursive: true })
    await mkdir(outside, { recursive: true })
    await mkdir(join(linkDir, 'realDir'), { recursive: true })
    await writeFile(join(linkDir, 'realDir', 'SKILL.md'), 'hand written')

    await symlink(join(skillsRoot, 'live'), join(linkDir, 'live'))
    await symlink(join(skillsRoot, 'shelved'), join(linkDir, 'shelved'))
    await symlink(
      join(skillsRoot, 'shelvedBundle', 'child'),
      join(linkDir, 'child'),
    )
    await symlink(outside, join(linkDir, 'elsewhere'))

    const input = { manifest, skillsRoot, linkDir, keep: [] as string[] }

    const planned = await pruneParkedLinks({ ...input, dryRun: true })
    assert.deepEqual(
      [...planned].sort((a, b) => a.localeCompare(b)),
      ['child', 'shelved'],
    )
    assert.equal((await lstat(join(linkDir, 'shelved'))).isSymbolicLink(), true)

    const removed = await pruneParkedLinks({ ...input, dryRun: false })
    assert.deepEqual(
      [...removed].sort((a, b) => a.localeCompare(b)),
      ['child', 'shelved'],
    )
    await assert.rejects(lstat(join(linkDir, 'shelved')))
    await assert.rejects(lstat(join(linkDir, 'child')))
    assert.equal(
      await readlink(join(linkDir, 'live')),
      join(skillsRoot, 'live'),
    )
    assert.equal(await readlink(join(linkDir, 'elsewhere')), outside)
    assert.equal((await lstat(join(linkDir, 'realDir'))).isDirectory(), true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

void test('prune spares a link the same run is about to keep', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rocket-agents-prune-'))
  try {
    const skillsRoot = join(root, 'library', 'skills')
    const linkDir = join(root, 'home', 'skills')
    const target = join(skillsRoot, 'shelvedBundle', 'child')
    await mkdir(target, { recursive: true })
    await mkdir(linkDir, { recursive: true })
    await symlink(target, join(linkDir, 'child'))

    const removed = await pruneParkedLinks({
      manifest,
      skillsRoot,
      linkDir,
      keep: [target],
      dryRun: false,
    })
    assert.deepEqual(removed, [])
    assert.equal(await readlink(join(linkDir, 'child')), target)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

void test('prune tolerates a link directory that does not exist', async () => {
  const removed = await pruneParkedLinks({
    manifest,
    skillsRoot: '/nonexistent/library/skills',
    linkDir: '/nonexistent/home/skills',
    keep: [],
    dryRun: false,
  })
  assert.deepEqual(removed, [])
})
