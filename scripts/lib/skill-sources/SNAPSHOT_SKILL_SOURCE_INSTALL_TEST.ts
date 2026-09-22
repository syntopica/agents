import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createSkillSourceSnapshot } from './createSkillSourceSnapshot'

void test('the lock and affected destinations are snapshotted before installation', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'skill-source-snapshot-'))
  await mkdir(join(libraryDir, 'skills', 'superpowers:brainstorming'), {
    recursive: true,
  })
  await writeFile(join(libraryDir, '.skill-lock.json'), 'lock-before\n')
  await writeFile(
    join(libraryDir, 'skills', 'superpowers:brainstorming', 'SKILL.md'),
    'before\n',
  )

  const snapshot = await createSkillSourceSnapshot(
    libraryDir,
    {
      version: 1,
      sources: [
        {
          id: 'superpowers',
          source: 'obra/superpowers',
          resolvedCommit: 'b36e0829c6d0140e93cfef2ca599b1b07d4a7797',
          skills: ['brainstorming', 'writing-plans'],
          targets: ['codex'],
        },
      ],
    },
    'run-test',
  )

  assert.equal(
    await readFile(join(snapshot.snapshotDir, '.skill-lock.json'), 'utf8'),
    'lock-before\n',
  )
  assert.equal(
    await readFile(
      join(
        snapshot.snapshotDir,
        'skills',
        'superpowers:brainstorming',
        'SKILL.md',
      ),
      'utf8',
    ),
    'before\n',
  )
  await assert.rejects(
    access(join(snapshot.snapshotDir, 'skills', 'superpowers:writing-plans')),
  )
  assert.match(
    await readFile(snapshot.manifestPath, 'utf8'),
    /"existed": false/,
  )
})
