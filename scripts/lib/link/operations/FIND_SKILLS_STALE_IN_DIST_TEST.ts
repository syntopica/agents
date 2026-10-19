import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { writeSkillFixture as writeSkill } from '../fixtures/writeSkillFixture'
import { findSkillsStaleInDist } from './findSkillsStaleInDist'

void test('a compiled copy that differs only by the rules index is current', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-content-'))
  const src = path.join(dir, 'src')
  const dist = path.join(dir, 'dist')
  await writeSkill(src, 'core/brp-docs')
  await writeSkill(dist, 'core/brp-docs')
  await fs.appendFile(
    path.join(dist, 'core/brp-docs/SKILL.md'),
    '\n\n## Rules Index\n<!-- GENERATED-RULES-INDEX:START -->\n- @rules/core/general.mdc\n<!-- GENERATED-RULES-INDEX:END -->\n',
  )

  assert.deepEqual(await findSkillsStaleInDist([src], dist), [])
  await fs.rm(dir, { recursive: true, force: true })
})

void test('an edited SKILL.md or a new reference file makes the copy stale', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-content-'))
  const src = path.join(dir, 'src')
  const dist = path.join(dir, 'dist')
  await writeSkill(src, 'core/job-day')
  await writeSkill(dist, 'core/job-day')
  await fs.appendFile(path.join(src, 'core/job-day/SKILL.md'), 'new rule\n')
  await writeSkill(src, 'core/job-application')
  await writeSkill(dist, 'core/job-application')
  await fs.mkdir(path.join(src, 'core/job-application/references'))
  await fs.writeFile(
    path.join(src, 'core/job-application/references/ashby.md'),
    '# Ashby\n',
  )

  assert.deepEqual(await findSkillsStaleInDist([src], dist), [
    path.join('core', 'job-application'),
    path.join('core', 'job-day'),
  ])
  await fs.rm(dir, { recursive: true, force: true })
})

void test('a file deleted from the source makes the compiled copy stale', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-content-'))
  const src = path.join(dir, 'src')
  const dist = path.join(dir, 'dist')
  await writeSkill(src, 'core/codex')
  await writeSkill(dist, 'core/codex')
  await fs.mkdir(path.join(dist, 'core/codex/references'))
  await fs.writeFile(path.join(dist, 'core/codex/references/old.md'), '# Old\n')

  assert.deepEqual(await findSkillsStaleInDist([src], dist), [
    path.join('core', 'codex'),
  ])
  await fs.rm(dir, { recursive: true, force: true })
})
