import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { writeSkillFixture } from './writeSkillFixture'

export const createCodexSkillTrimFixture = async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-trim-write-'))
  const canonical = path.join(root, 'library')
  const skillsDir = path.join(root, 'library-alias')
  const curatedDir = path.join(root, 'curated')
  const configPath = path.join(root, 'config.toml')
  const enabledNames = Array.from(
    { length: 23 },
    (_, index) => `kept-${String(index)}`,
  )
  await fs.mkdir(curatedDir)
  await fs.mkdir(canonical)
  await fs.symlink(canonical, skillsDir)
  for (const name of [...enabledNames, 'codex', 'computer-use', 'unselected']) {
    await writeSkillFixture(canonical, name)
    if (name !== 'unselected') {
      await fs.symlink(path.join(skillsDir, name), path.join(curatedDir, name))
    }
  }
  const exclusions = ['codex', 'computer-use']
    .map((name) =>
      [
        '[[skills.config]]',
        `path = "${skillsDir}/${name}/SKILL.md"`,
        'enabled = false',
      ].join('\n'),
    )
    .join('\n\n')
  const config = `model = "custom-model"\n\n${exclusions}\n\n[profiles.work]\nmodel = "work-model"\n`
  await fs.writeFile(configPath, config)
  return { root, configPath, skillsDir, curatedDir, enabledNames, config }
}
