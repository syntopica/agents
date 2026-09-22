import assert from 'node:assert/strict'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { inspectPlatform } from './inspectPlatform'
import type { PlatformDefinition } from './types/PlatformDefinition'
import type { PlatformRuntimeState } from './types/PlatformRuntimeState'

void test('declared capabilities report healthy, degraded, and unsupported states', async () => {
  const root = await mkdtemp(join(tmpdir(), 'platform-inspection-'))
  const skillsDir = join(root, 'skills')
  const healthySkill = join(skillsDir, 'healthy')
  await mkdir(healthySkill, { recursive: true })
  await writeFile(
    join(healthySkill, 'SKILL.md'),
    '---\nname: healthy\ndescription: Healthy.\n---\n',
  )
  await symlink(join(root, 'missing-skill'), join(skillsDir, 'broken'))

  const definition: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills', 'mcp', 'plugins'],
    probe: { configPaths: [root] },
  }
  const runtime: PlatformRuntimeState = {
    registryId: 'test',
    lifecycle: 'provisioned',
    probes: [],
  }

  const result = await inspectPlatform({
    definition,
    runtime,
    paths: { skillsDir },
  })

  assert.equal(result.lifecycle, 'provisioned')
  assert.equal(
    result.capabilities.find(({ capability }) => capability === 'skills')
      ?.status,
    'degraded',
  )
  assert.equal(
    result.capabilities.find(({ capability }) => capability === 'mcp')?.status,
    'unsupported',
  )
  assert.equal(
    result.capabilities.find(({ capability }) => capability === 'plugins')
      ?.status,
    'unsupported',
  )
})

void test('an unavailable platform does not fail missing capability paths', async () => {
  const definition: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills'],
    probe: { configPaths: ['$HOME/.missing'] },
  }
  const runtime: PlatformRuntimeState = {
    registryId: 'test',
    lifecycle: 'unavailable',
    probes: [],
  }

  const result = await inspectPlatform({ definition, runtime, paths: {} })
  assert.equal(result.capabilities[0]?.status, 'not-applicable')
})

void test('Claude security settings require the owned safe policy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'platform-security-'))
  const personal = join(root, 'personal.json')
  const secondary = join(root, 'secondary.json')
  const safeSettings = JSON.stringify({
    permissions: { defaultMode: 'auto' },
    skipDangerousModePermissionPrompt: true,
    remoteControlAtStartup: true,
  })
  await writeFile(personal, safeSettings)
  await writeFile(secondary, safeSettings)

  const definition: PlatformDefinition = {
    registryId: 'claude',
    capabilities: ['security'],
    probe: { configPaths: [root] },
  }
  const runtime: PlatformRuntimeState = {
    registryId: 'claude',
    lifecycle: 'provisioned',
    probes: [],
  }

  const healthy = await inspectPlatform({
    definition,
    runtime,
    paths: { securitySettingsPaths: [personal, secondary] },
  })
  assert.equal(healthy.capabilities[0]?.status, 'healthy')

  await writeFile(
    secondary,
    JSON.stringify({ permissions: { defaultMode: 'default' } }),
  )
  const failed = await inspectPlatform({
    definition,
    runtime,
    paths: { securitySettingsPaths: [personal, secondary] },
  })
  assert.equal(failed.capabilities[0]?.status, 'failed')
  assert.deepEqual(failed.capabilities[0].findings, [secondary])
})
