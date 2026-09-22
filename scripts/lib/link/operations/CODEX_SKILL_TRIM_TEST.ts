import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { CODEX_SKILL_TRIM_MARKERS } from '../constants/CODEX_SKILL_TRIM_MARKERS'
import { applyCodexSkillTrim } from './applyCodexSkillTrim'
import { collectCodexSkillTrimPaths } from './collectCodexSkillTrimPaths'
import { renderCodexSkillTrim } from './renderCodexSkillTrim'

void test('the block is appended when the config carries no markers', () => {
  const applied = applyCodexSkillTrim(
    'model = "gpt-5.6-sol"\n',
    renderCodexSkillTrim(['/skills/a/SKILL.md']),
  )

  assert.match(applied, /model = "gpt-5\.6-sol"/u)
  assert.match(applied, /path = "\/skills\/a\/SKILL\.md"/u)
  assert.equal(applied.split(CODEX_SKILL_TRIM_MARKERS.start).length - 1, 1)
})

void test('regenerating replaces the block and keeps everything around it', () => {
  const first = applyCodexSkillTrim(
    '[mcp_servers.one]\ncommand = "x"\n',
    renderCodexSkillTrim(['/skills/a/SKILL.md']),
  )
  const second = applyCodexSkillTrim(
    `${first}\n[profiles.work]\nmodel = "y"\n`,
    renderCodexSkillTrim(['/skills/b/SKILL.md']),
  )

  assert.equal(second.split(CODEX_SKILL_TRIM_MARKERS.start).length - 1, 1)
  assert.doesNotMatch(second, /\/skills\/a\/SKILL\.md/u)
  assert.match(second, /\/skills\/b\/SKILL\.md/u)
  assert.match(second, /\[mcp_servers\.one\]/u)
  assert.match(second, /\[profiles\.work\]/u)
})

void test('a half-written fence is left alone rather than swallowing the file', () => {
  const config = `${CODEX_SKILL_TRIM_MARKERS.start}\n[profiles.work]\nmodel = "y"\n`
  const applied = applyCodexSkillTrim(
    config,
    renderCodexSkillTrim(['/skills/a/SKILL.md']),
  )

  assert.match(applied, /\[profiles\.work\]/u)
  assert.match(applied, /path = "\/skills\/a\/SKILL\.md"/u)
})

void test('only skills outside the curated destination are disabled', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-trim-'))
  const skillsDir = path.join(root, 'skills')
  const curatedDir = path.join(root, 'curated')
  await fs.mkdir(path.join(skillsDir, 'core', 'kept'), { recursive: true })
  await fs.mkdir(path.join(skillsDir, 'bundle', 'nested'), { recursive: true })
  await fs.mkdir(curatedDir, { recursive: true })
  await fs.writeFile(path.join(skillsDir, 'core', 'kept', 'SKILL.md'), 'kept')
  await fs.writeFile(
    path.join(skillsDir, 'bundle', 'nested', 'SKILL.md'),
    'nested',
  )
  await fs.symlink(
    path.join(skillsDir, 'core', 'kept'),
    path.join(curatedDir, 'kept'),
  )

  const disabled = await collectCodexSkillTrimPaths({ skillsDir, curatedDir })

  assert.deepEqual(disabled, [
    path.join(skillsDir, 'bundle', 'nested', 'SKILL.md'),
  ])
  await fs.rm(root, { recursive: true, force: true })
})
