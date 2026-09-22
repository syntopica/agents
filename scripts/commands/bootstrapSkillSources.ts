import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { flagValue } from '../lib/machine/cli/flagValue'
import { createSkillSourceSnapshot } from '../lib/skill-sources/createSkillSourceSnapshot'
import { importInstalledSkillSource } from '../lib/skill-sources/importInstalledSkillSource'
import { parseSkillSourceManifest } from '../lib/skill-sources/parseSkillSourceManifest'
import { planSkillSourceApply } from '../lib/skill-sources/planSkillSourceApply'
import { planSkillSourceInstall } from '../lib/skill-sources/planSkillSourceInstall'
import { resolveSkillSourceHead } from '../lib/skill-sources/resolveSkillSourceHead'
import { resolveSkillSourceManifestPath } from '../lib/skill-sources/resolveSkillSourceManifestPath'

export const main = async () => {
  const apply = process.argv.includes('--apply')
  const manifestPath = resolveSkillSourceManifestPath(
    process.argv,
    process.env,
    process.cwd(),
  )
  const libraryDir =
    flagValue(process.argv, '--library') ?? join(homedir(), '.agents')
  const parsed = parseSkillSourceManifest(
    JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
  )
  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  const plans = parsed.manifest.sources.map((source) => ({
    id: source.id,
    source: source.source,
    resolvedCommit: source.resolvedCommit,
    args: planSkillSourceInstall(source),
    applyArgs: planSkillSourceApply(source),
    securityExceptions: source.securityExceptions ?? [],
  }))
  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', plans }, null, 2))
    return
  }

  for (const source of parsed.manifest.sources) {
    const currentHead = resolveSkillSourceHead(source.source)
    if (currentHead !== source.resolvedCommit) {
      console.error(
        `${source.id}: resolved HEAD ${currentHead ?? 'unavailable'} does not match ${source.resolvedCommit}`,
      )
      process.exitCode = 1
      return
    }
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshot = await createSkillSourceSnapshot(
    libraryDir,
    parsed.manifest,
    runId,
  )
  for (const [index, plan] of plans.entries()) {
    const result = spawnSync('skillkit', plan.applyArgs, {
      encoding: 'utf8',
      stdio: 'pipe',
    })
    if (result.stdout.trim() !== '') console.log(result.stdout.trim())
    if (result.status !== 0) {
      if (result.stderr.trim() !== '') console.error(result.stderr.trim())
      console.error(
        `${plan.id}: installation failed; snapshot retained at ${snapshot.snapshotDir}`,
      )
      process.exitCode = 1
      return
    }
    const source = parsed.manifest.sources.at(index)
    if (source === undefined)
      throw new Error(`${plan.id}: source plan index is inconsistent`)
    await importInstalledSkillSource(
      source,
      join(homedir(), '.claude', 'skills'),
      libraryDir,
    )
  }
  console.log(
    JSON.stringify(
      { mode: 'applied', snapshotDir: snapshot.snapshotDir, plans },
      null,
      2,
    ),
  )
}
