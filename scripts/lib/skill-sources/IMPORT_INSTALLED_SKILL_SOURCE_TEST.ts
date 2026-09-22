import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { importInstalledSkillSource } from './importInstalledSkillSource'

void test('scanned skillkit output is imported into the canonical library', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skill-source-import-'))
  const installedSkillsDir = join(root, 'installed')
  const libraryDir = join(root, 'library')
  await mkdir(join(installedSkillsDir, 'brainstorming'), { recursive: true })
  await mkdir(join(libraryDir, 'skills', 'superpowers:brainstorming'), {
    recursive: true,
  })
  await writeFile(
    join(installedSkillsDir, 'brainstorming', 'SKILL.md'),
    'new\n',
  )
  await writeFile(
    join(libraryDir, 'skills', 'superpowers:brainstorming', 'SKILL.md'),
    'old\n',
  )

  await importInstalledSkillSource(
    {
      id: 'superpowers',
      source: 'obra/superpowers',
      resolvedCommit: 'b36e0829c6d0140e93cfef2ca599b1b07d4a7797',
      skills: ['brainstorming'],
      targets: ['codex'],
    },
    installedSkillsDir,
    libraryDir,
  )

  assert.equal(
    await readFile(
      join(libraryDir, 'skills', 'superpowers:brainstorming', 'SKILL.md'),
      'utf8',
    ),
    'new\n',
  )
})
