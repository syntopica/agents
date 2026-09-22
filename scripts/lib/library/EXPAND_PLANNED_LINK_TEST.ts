import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { expandPlannedLink } from './expandPlannedLink'

void test('a directory that is itself a skill is left alone', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-expand-'))
  const target = join(dir, 'frontend-design')
  await mkdir(target, { recursive: true })
  await writeFile(join(target, 'SKILL.md'), '---\nname: frontend-design\n---\n')

  const expanded = await expandPlannedLink({
    name: 'frontend-design',
    target,
    entryKey: 'frontend-design',
    logicalName: 'frontend-design',
  })
  assert.deepEqual(expanded, [
    {
      name: 'frontend-design',
      target,
      entryKey: 'frontend-design',
      logicalName: 'frontend-design',
    },
  ])
})

void test('a bundle with no SKILL.md expands to the skills inside it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-expand-'))
  const bundle = join(dir, 'core')
  await mkdir(join(bundle, 'brp-docs'), { recursive: true })
  await mkdir(join(bundle, 'brp-release'), { recursive: true })
  await writeFile(join(bundle, 'brp-docs', 'SKILL.md'), 'x')
  await writeFile(join(bundle, 'brp-release', 'SKILL.md'), 'x')

  const expanded = await expandPlannedLink({
    name: 'core',
    target: bundle,
    entryKey: 'core',
    logicalName: 'core',
  })
  assert.deepEqual(
    expanded.map((link) => link.name).toSorted((a, b) => a.localeCompare(b)),
    ['brp-docs', 'brp-release'],
  )
  assert.equal(expanded[0]?.entryKey.startsWith('core/'), true)
})

void test('a child directory without a SKILL.md is not linked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-expand-'))
  const bundle = join(dir, 'core')
  await mkdir(join(bundle, 'references'), { recursive: true })
  await mkdir(join(bundle, 'brp-docs'), { recursive: true })
  await writeFile(join(bundle, 'brp-docs', 'SKILL.md'), 'x')

  const expanded = await expandPlannedLink({
    name: 'core',
    target: bundle,
    entryKey: 'core',
    logicalName: 'core',
  })
  assert.deepEqual(
    expanded.map((link) => link.name),
    ['brp-docs'],
  )
})
