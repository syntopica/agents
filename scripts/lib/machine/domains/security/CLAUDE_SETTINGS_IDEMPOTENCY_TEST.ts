import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createSnapshot } from '../../runs/createSnapshot'
import { restoreSnapshot } from '../../runs/restoreSnapshot'
import { planClaudeSettings } from './planClaudeSettings'
import { readClaudeSettings } from './readClaudeSettings'
import type { ClaudeSecurityPolicy } from './types/ClaudeSecurityPolicy'
import type { ClaudeSettingsPaths } from './types/ClaudeSettingsPaths'
import { writeClaudeSettings } from './writeClaudeSettings'

void test('owned Claude settings converge while foreign settings and profile state survive', async () => {
  const policy: ClaudeSecurityPolicy = {
    profiles: ['claude-personal', 'claude-secondary'],
    defaultMode: 'auto',
    skipDangerousModePermissionPrompt: true,
    remoteControlAtStartup: true,
    remoteControlExceptionReason: 'Required by the remote terminal workflow',
  }
  const home = await mkdtemp(join(tmpdir(), 'claude-settings-'))
  const paths: ClaudeSettingsPaths = {
    'claude-personal': join(home, '.claude', 'settings.json'),
    'claude-secondary': join(home, '.claude-secondary', 'settings.json'),
  }
  const personalCredentials = join(home, '.claude', '.credentials.json')
  const secondaryCredentials = join(
    home,
    '.claude-secondary',
    '.credentials.json',
  )
  await mkdir(join(home, '.claude'), { recursive: true })
  await mkdir(join(home, '.claude-secondary'), { recursive: true })
  await writeFile(
    paths['claude-personal'],
    `${JSON.stringify({ permissions: { allow: ['Read'], defaultMode: 'plan' }, enabledPlugins: { alpha: true }, theme: 'dark' }, null, 2)}\n`,
  )
  await writeFile(
    paths['claude-secondary'],
    `${JSON.stringify({ permissions: { deny: ['Read(.env)'] }, enabledPlugins: { beta: true }, model: 'opus' }, null, 2)}\n`,
  )
  await writeFile(personalCredentials, 'personal-profile-state')
  await writeFile(secondaryCredentials, 'secondary-profile-state')

  const runDir = join(home, 'run')
  const settingsFiles = [paths['claude-personal'], paths['claude-secondary']]
  await createSnapshot({ runDir, files: settingsFiles })
  const firstOwned = await writeClaudeSettings({ paths, policy })
  const firstBytes = await Promise.all(
    settingsFiles.map((path) => readFile(path, 'utf8')),
  )
  const current = await readClaudeSettings(paths)

  assert.deepEqual(planClaudeSettings(policy, current), [])
  assert.deepEqual(firstOwned['claude-personal'], [
    'permissions.defaultMode',
    'skipDangerousModePermissionPrompt',
    'remoteControlAtStartup',
  ])
  assert.deepEqual(current['claude-personal']['enabledPlugins'], {
    alpha: true,
  })
  assert.deepEqual(current['claude-secondary']['enabledPlugins'], {
    beta: true,
  })
  assert.deepEqual(current['claude-personal']['permissions'], {
    allow: ['Read'],
    defaultMode: 'auto',
  })
  assert.deepEqual(current['claude-secondary']['permissions'], {
    deny: ['Read(.env)'],
    defaultMode: 'auto',
  })
  assert.equal(
    await readFile(personalCredentials, 'utf8'),
    'personal-profile-state',
  )
  assert.equal(
    await readFile(secondaryCredentials, 'utf8'),
    'secondary-profile-state',
  )

  await writeClaudeSettings({ paths, policy })
  assert.deepEqual(
    await Promise.all(settingsFiles.map((path) => readFile(path, 'utf8'))),
    firstBytes,
  )

  await restoreSnapshot({ runDir })
  assert.equal(
    (await readClaudeSettings(paths))['claude-personal']['theme'],
    'dark',
  )
})

void test('invalid existing JSON is rejected instead of overwritten', async () => {
  const policy: ClaudeSecurityPolicy = {
    profiles: ['claude-personal', 'claude-secondary'],
    defaultMode: 'auto',
    skipDangerousModePermissionPrompt: true,
    remoteControlAtStartup: true,
    remoteControlExceptionReason: 'Required by the remote terminal workflow',
  }
  const home = await mkdtemp(join(tmpdir(), 'claude-settings-invalid-'))
  const paths: ClaudeSettingsPaths = {
    'claude-personal': join(home, 'personal.json'),
    'claude-secondary': join(home, 'secondary.json'),
  }
  await writeFile(paths['claude-personal'], '{ invalid')
  await writeFile(paths['claude-secondary'], '{}')

  await assert.rejects(writeClaudeSettings({ paths, policy }), SyntaxError)
})
