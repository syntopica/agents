import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { retireInstalledSkills } from './retireInstalledSkills'

void test('an installed skill moves into the backup so skillkit installs it fresh', async () => {
  const root = await mkdtemp(join(tmpdir(), 'skill-source-retire-'))
  const installedSkillsDir = join(root, 'installed')
  const backupDir = join(root, 'backup')
  await mkdir(join(installedSkillsDir, 'better-ui'), { recursive: true })
  await writeFile(join(installedSkillsDir, 'better-ui', 'SKILL.md'), 'old\n')

  await retireInstalledSkills(
    ['better-ui', 'absent'],
    installedSkillsDir,
    backupDir,
  )

  await assert.rejects(access(join(installedSkillsDir, 'better-ui')))
  assert.equal(
    await readFile(join(backupDir, 'better-ui', 'SKILL.md'), 'utf8'),
    'old\n',
  )
  await assert.rejects(access(join(backupDir, 'absent')))
})
