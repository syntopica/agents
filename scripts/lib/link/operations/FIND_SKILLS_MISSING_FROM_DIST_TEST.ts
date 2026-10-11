import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { writeSkillFixture as writeSkill } from '../fixtures/writeSkillFixture'
import { findSkillsMissingFromDist } from './findSkillsMissingFromDist'

void test('a source skill absent from dist is reported, from every root', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-dist-'))
  const engine = path.join(dir, 'engine')
  const instance = path.join(dir, 'instance')
  const dist = path.join(dir, 'dist')
  await writeSkill(engine, 'core/brp-docs')
  await writeSkill(instance, 'core/job-day')
  await writeSkill(instance, 'core/nubenode-daily')
  await writeSkill(dist, 'core/brp-docs')
  await writeSkill(dist, 'core/nubenode-daily')

  assert.deepEqual(await findSkillsMissingFromDist([engine, instance], dist), [
    path.join('core', 'job-day'),
  ])
  await fs.rm(dir, { recursive: true, force: true })
})

void test('a dist holding every source skill reports nothing', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stale-dist-'))
  const engine = path.join(dir, 'engine')
  const dist = path.join(dir, 'dist')
  await writeSkill(engine, 'core/brp-docs')
  await writeSkill(dist, 'core/brp-docs')
  await writeSkill(dist, 'orchestrator/extra')

  assert.deepEqual(await findSkillsMissingFromDist([engine], dist), [])
  await fs.rm(dir, { recursive: true, force: true })
})
