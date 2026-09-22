import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { validateCompiledLibrary } from './validators/validateCompiledLibrary'

void test('a strict compiled catalogue rejects Claude fields and namespaced filenames', async () => {
  const root = await mkdtemp(join(tmpdir(), 'library-validate-'))
  const outputPath = join(root, 'superpowers:debugging')
  await mkdir(outputPath)
  await writeFile(
    join(outputPath, 'SKILL.md'),
    '---\nname: superpowers:debugging\ndescription: Debug\nallowed-tools: Read\n---\nBody\n',
  )

  const errors = await validateCompiledLibrary(
    [
      {
        logicalName: 'superpowers:debugging',
        targetName: 'superpowers:debugging',
        sourcePath: outputPath,
        outputPath,
      },
    ],
    'codex',
  )

  assert.equal(
    errors.some((error) => error.includes('Claude extension')),
    true,
  )
  assert.equal(
    errors.some((error) => error.includes('filesystem-safe')),
    true,
  )
})

void test('a portable compiled catalogue validates cleanly', async () => {
  const root = await mkdtemp(join(tmpdir(), 'library-validate-ok-'))
  const outputPath = join(root, 'debugging')
  await mkdir(outputPath)
  await writeFile(
    join(outputPath, 'SKILL.md'),
    '---\nname: debugging\ndescription: Debug\n---\nBody\n',
  )

  assert.deepEqual(
    await validateCompiledLibrary(
      [
        {
          logicalName: 'debugging',
          targetName: 'debugging',
          sourcePath: outputPath,
          outputPath,
        },
      ],
      'codex',
    ),
    [],
  )
})
