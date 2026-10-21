import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { CODEX_SKILL_TRIM_MARKERS } from '../constants/CODEX_SKILL_TRIM_MARKERS'
import { createCodexSkillTrimFixture } from '../fixtures/createCodexSkillTrimFixture'
import { applyCodexSkillTrim } from './applyCodexSkillTrim'
import { collectCodexSkillTrimPaths } from './collectCodexSkillTrimPaths'
import { renderCodexSkillTrim } from './renderCodexSkillTrim'
import { writeCodexSkillTrim } from './writeCodexSkillTrim'

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

void test('an orphaned end before the fence does not make the block grow', () => {
  const orphan = `[[skills.config]]\npath = "/skills/old/SKILL.md"\nenabled = false\n${CODEX_SKILL_TRIM_MARKERS.end}\n\n`
  const fenced = applyCodexSkillTrim(
    orphan,
    renderCodexSkillTrim(['/skills/a/SKILL.md']),
  )
  const again = applyCodexSkillTrim(
    fenced,
    renderCodexSkillTrim(['/skills/a/SKILL.md']),
  )

  assert.equal(again, fenced)
  assert.equal(again.split(CODEX_SKILL_TRIM_MARKERS.start).length - 1, 1)
})

void test('regeneration retains 23 curated selections and explicit exclusions through aliases', async (t) => {
  const fixture = await createCodexSkillTrimFixture()
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }))
  const stale = applyCodexSkillTrim(
    fixture.config,
    renderCodexSkillTrim(
      fixture.enabledNames.map((name) =>
        path.join(fixture.skillsDir, name, 'SKILL.md'),
      ),
    ),
  )
  await fs.writeFile(fixture.configPath, stale)

  assert.deepEqual(await writeCodexSkillTrim(fixture), {
    written: true,
    disabled: 1,
  })
  const updated = await fs.readFile(fixture.configPath, 'utf8')
  assert.ok(updated.startsWith(fixture.config.trimEnd()))
  for (const name of fixture.enabledNames) {
    assert.ok(!updated.includes(path.join(fixture.skillsDir, name, 'SKILL.md')))
  }
  assert.ok(updated.includes(`${fixture.skillsDir}/unselected/SKILL.md`))
  for (const name of ['codex', 'computer-use']) {
    assert.equal(
      updated.split(`${fixture.skillsDir}/${name}/SKILL.md`).length,
      2,
    )
  }

  const before = await fs.stat(fixture.configPath, { bigint: true })
  assert.deepEqual(await writeCodexSkillTrim(fixture), {
    written: false,
    disabled: 1,
  })
  assert.equal(await fs.readFile(fixture.configPath, 'utf8'), updated)
  assert.equal(
    (await fs.stat(fixture.configPath, { bigint: true })).mtimeNs,
    before.mtimeNs,
  )
  const backups = (await fs.readdir(fixture.root)).filter((name) =>
    name.startsWith('config.toml.backup-'),
  )
  assert.equal(backups.length, 1)
  assert.ok(backups[0])
  assert.equal(
    await fs.readFile(path.join(fixture.root, backups[0]), 'utf8'),
    stale,
  )
})

void test('selection permission errors cannot generate an empty desired selection', async (t) => {
  const fixture = await createCodexSkillTrimFixture()
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }))
  const readDirectory = t.mock.method(fs, 'readdir', (directory: string) => {
    assert.equal(directory, fixture.curatedDir)
    return Promise.reject(
      Object.assign(new Error('Fixture selection is unreadable'), {
        code: 'EACCES',
      }),
    )
  })
  await assert.rejects(writeCodexSkillTrim(fixture), { code: 'EACCES' })
  readDirectory.mock.restore()
  assert.equal(await fs.readFile(fixture.configPath, 'utf8'), fixture.config)
  assert.ok(
    !(await fs.readdir(fixture.root)).some((name) => name.includes('.backup-')),
  )
})

void test('missing selection or library aborts without writing config or backup', async (t) => {
  const fixture = await createCodexSkillTrimFixture()
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }))
  for (const missing of ['curatedDir', 'skillsDir'] as const) {
    await assert.rejects(
      writeCodexSkillTrim({
        ...fixture,
        [missing]: path.join(fixture.root, 'missing'),
      }),
      { code: 'ENOENT' },
    )
    assert.equal(await fs.readFile(fixture.configPath, 'utf8'), fixture.config)
    assert.ok(
      !(await fs.readdir(fixture.root)).some((name) =>
        name.includes('.backup-'),
      ),
    )
  }
})

void test('broken curated aliases and unreadable config propagate instead of clearing selection', async (t) => {
  const fixture = await createCodexSkillTrimFixture()
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }))
  await fs.symlink(
    path.join(fixture.root, 'missing'),
    path.join(fixture.curatedDir, 'broken'),
  )
  await assert.rejects(writeCodexSkillTrim(fixture), { code: 'ENOENT' })
  await assert.rejects(
    writeCodexSkillTrim({ ...fixture, configPath: fixture.root }),
    {
      code: 'EISDIR',
    },
  )
  assert.equal(await fs.readFile(fixture.configPath, 'utf8'), fixture.config)
  assert.ok(
    !(await fs.readdir(fixture.root)).some((name) => name.includes('.backup-')),
  )
})
