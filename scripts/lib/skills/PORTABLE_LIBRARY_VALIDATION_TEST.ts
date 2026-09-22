import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'
import { SKILL_SOURCE_DIRS } from '../../constants/SKILL_SOURCE_DIRS'
import { compilePortableSkillContents } from '../library/compilePortableSkillContents'
import { classifySkillPortability } from './classifySkillPortability'
import { listSkillDirs } from './loaders/listSkillDirs'
import { listSkillDirsAcross } from './loaders/listSkillDirsAcross'

void test('portable repository and managed library views contain no invalid target skills', async () => {
  const sourceDirs = await listSkillDirsAcross(SKILL_SOURCE_DIRS)
  assert.equal(sourceDirs.length > 0, true)
  for (const sourceDir of sourceDirs) {
    const sourcePath = join(sourceDir, 'SKILL.md')
    const compiled = compilePortableSkillContents(
      await readFile(sourcePath, 'utf8'),
      basename(sourceDir),
    )
    assert.equal(
      classifySkillPortability(sourcePath, compiled).kind,
      'portable',
      sourcePath,
    )
  }

  for (const target of ['codex', 'gemini-cli']) {
    const root = join(homedir(), '.agents', 'compiled', target, 'skills')
    const exists = await access(root)
      .then(() => true)
      .catch(() => false)
    if (!exists) continue
    for (const skillDir of await listSkillDirs(root)) {
      const skillPath = join(skillDir, 'SKILL.md')
      assert.equal(
        classifySkillPortability(skillPath, await readFile(skillPath, 'utf8'))
          .kind,
        'portable',
        skillPath,
      )
    }
  }
})
