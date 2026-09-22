import assert from 'node:assert/strict'
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { detectPlatformRuntime } from './detectPlatformRuntime'
import type { PlatformDefinition } from './types/PlatformDefinition'

void test('a runtime command makes the platform active', async () => {
  const home = await mkdtemp(join(tmpdir(), 'platform-runtime-'))
  const executable = join(home, 'agent-cli')
  await writeFile(executable, '#!/bin/sh\n')
  await chmod(executable, 0o755)

  const platform: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills'],
    probe: { commands: ['agent-cli'], configPaths: [] },
  }
  const result = await detectPlatformRuntime(platform, {
    env: { PATH: home },
    home,
  })

  assert.equal(result.lifecycle, 'active')
})

void test('an application path makes the platform active', async () => {
  const home = await mkdtemp(join(tmpdir(), 'platform-runtime-'))
  await mkdir(join(home, 'Agent.app'))
  const platform: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills'],
    probe: { appPaths: ['$HOME/Agent.app'], configPaths: [] },
  }

  const result = await detectPlatformRuntime(platform, { env: {}, home })
  assert.equal(result.lifecycle, 'active')
})

void test('generated configuration alone is provisioned, not active', async () => {
  const home = await mkdtemp(join(tmpdir(), 'platform-runtime-'))
  await mkdir(join(home, '.agent'))
  const platform: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills'],
    probe: { configPaths: ['$HOME/.agent'] },
  }

  const result = await detectPlatformRuntime(platform, { env: {}, home })
  assert.equal(result.lifecycle, 'provisioned')
})

void test('a platform with no matching probe is unavailable', async () => {
  const home = await mkdtemp(join(tmpdir(), 'platform-runtime-'))
  const platform: PlatformDefinition = {
    registryId: 'test',
    capabilities: ['skills'],
    probe: { commands: ['missing'], configPaths: ['$HOME/.missing'] },
  }

  const result = await detectPlatformRuntime(platform, {
    env: { PATH: home },
    home,
  })
  assert.equal(result.lifecycle, 'unavailable')
})
