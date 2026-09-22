import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { installCopiedSkill } from './installCopiedSkill'
import { linkStrategyForTarget } from './linkStrategyForTarget'
import { pathIsAbsent } from './pathIsAbsent'
import type { PlannedLink } from './types/PlannedLink'

void test('antigravity takes copies, and claude keeps symlinks', () => {
  assert.equal(linkStrategyForTarget('antigravity'), 'copy')
  assert.equal(linkStrategyForTarget('claude'), 'symlink')
})

void test('a copied skill replaces the previous copy and spares a foreign directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rocket-agents-copy-'))
  try {
    const compiled = join(root, 'compiled', 'brainstorming')
    await mkdir(compiled, { recursive: true })
    await writeFile(join(compiled, 'SKILL.md'), 'second revision')
    const linkDir = join(root, 'skills')
    const link: PlannedLink = {
      name: 'brainstorming',
      target: compiled,
      entryKey: 'superpowers:brainstorming',
      logicalName: 'brainstorming',
    }

    const planned = await installCopiedSkill(link, linkDir, true)
    assert.equal(planned.kind, 'created')
    assert.equal(await pathIsAbsent(join(linkDir, 'brainstorming')), true)

    await mkdir(join(linkDir, 'brainstorming'), { recursive: true })
    await writeFile(
      join(linkDir, 'brainstorming', 'SKILL.md'),
      'first revision',
    )
    assert.equal(
      (await installCopiedSkill(link, linkDir, false)).kind,
      'created',
    )
    assert.equal(
      await readFile(join(linkDir, 'brainstorming', 'SKILL.md'), 'utf8'),
      'second revision',
    )

    const foreign: PlannedLink = { ...link, name: 'handwritten' }
    await mkdir(join(linkDir, 'handwritten'), { recursive: true })
    const outcome = await installCopiedSkill(foreign, linkDir, false)
    assert.equal(outcome.kind, 'foreign')
    assert.equal(await pathIsAbsent(join(linkDir, 'handwritten')), false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
