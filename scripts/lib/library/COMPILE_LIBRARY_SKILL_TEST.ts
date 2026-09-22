import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { compileLibrarySkill } from './compileLibrarySkill'
import { compileLibraryTarget } from './compileLibraryTarget'
import { resolveTargetSkillName } from './resolveTargetSkillName'

void test('Claude retains native fields while Codex receives a portable view', async () => {
  const root = await mkdtemp(join(tmpdir(), 'library-compile-'))
  const sourcePath = join(root, 'source')
  await mkdir(sourcePath)
  await writeFile(
    join(sourcePath, 'SKILL.md'),
    '---\nname: example\ndescription: Example skill\nallowed-tools: Read\nargument-hint: topic\n---\nBody\n',
  )
  const claude = await compileLibrarySkill({
    logicalName: 'example',
    sourcePath,
    outputRoot: join(root, 'claude'),
    target: 'claude',
  })
  const codex = await compileLibrarySkill({
    logicalName: 'example',
    sourcePath,
    outputRoot: join(root, 'codex'),
    target: 'codex',
  })

  const claudeContents = await readFile(
    join(claude.outputPath, 'SKILL.md'),
    'utf8',
  )
  const codexContents = await readFile(
    join(codex.outputPath, 'SKILL.md'),
    'utf8',
  )
  assert.equal(claudeContents.includes('allowed-tools:'), true)
  assert.equal(claudeContents.includes('argument-hint:'), true)
  assert.equal(codexContents.includes('allowed-tools:'), false)
  assert.equal(codexContents.includes('argument-hint:'), false)
  assert.equal(codexContents.includes('description: Example skill'), true)
})

void test('a namespaced logical key receives a portable filesystem alias', async () => {
  const root = await mkdtemp(join(tmpdir(), 'library-alias-'))
  const sourcePath = join(root, 'source')
  await mkdir(sourcePath)
  await writeFile(
    join(sourcePath, 'SKILL.md'),
    '---\nname: superpowers:systematic-debugging\ndescription: Debug systematically\n---\nBody\n',
  )

  const compiled = await compileLibrarySkill({
    logicalName: 'superpowers:systematic-debugging',
    sourcePath,
    outputRoot: join(root, 'codex'),
    target: 'codex',
  })

  assert.equal(compiled.logicalName, 'superpowers:systematic-debugging')
  assert.equal(compiled.targetName, 'superpowers-systematic-debugging')
  assert.equal(
    resolveTargetSkillName('superpowers:systematic-debugging', 'codex'),
    compiled.targetName,
  )
  assert.match(
    await readFile(join(compiled.outputPath, 'SKILL.md'), 'utf8'),
    /^---\nname: superpowers-systematic-debugging$/m,
  )
})

void test('a missing curated source is reported without aborting the target build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'library-missing-'))

  const result = await compileLibraryTarget(
    join(root, 'skills'),
    join(root, 'compiled'),
    'codex',
    ['core/missing'],
  )

  assert.deepEqual(result.compiled, [])
  assert.equal(result.missing.length, 1)
  assert.match(result.missing[0] ?? '', /core\/missing has no directory/)
})
