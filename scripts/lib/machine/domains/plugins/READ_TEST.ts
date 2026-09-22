import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { createTempPluginsHome } from './fixtures/createTempPluginsHome'
import { readEnabledPlugins } from './readEnabledPlugins'
import { readInstalledPlugins } from './readInstalledPlugins'
import { readMarketplaces } from './readMarketplaces'

void test('marketplaces are read with a flattened source', async () => {
  const home = await createTempPluginsHome({
    'known_marketplaces.json': JSON.stringify({
      official: {
        source: {
          source: 'github',
          repo: 'anthropics/claude-plugins-official',
        },
      },
      local: { source: { source: 'directory', path: '/opt/marketplace' } },
    }),
  })

  assert.deepEqual(
    await readMarketplaces(join(home, 'known_marketplaces.json')),
    [
      { name: 'local', source: 'directory:/opt/marketplace' },
      { name: 'official', source: 'github:anthropics/claude-plugins-official' },
    ],
  )
})

void test('a missing marketplace file reads as empty instead of throwing', async () => {
  assert.deepEqual(
    await readMarketplaces('/nonexistent/known_marketplaces.json'),
    [],
  )
})

void test('installed plugins keep version, scope and commit sha', async () => {
  const home = await createTempPluginsHome({
    'installed_plugins.json': JSON.stringify({
      version: 2,
      plugins: {
        'alpha@official': [
          {
            scope: 'user',
            installPath: '/cache/official/alpha/1.0.0',
            version: '1.0.0',
            gitCommitSha: 'abc123',
          },
        ],
      },
    }),
  })

  assert.deepEqual(
    await readInstalledPlugins(join(home, 'installed_plugins.json')),
    [
      {
        id: 'alpha@official',
        scope: 'user',
        version: '1.0.0',
        installPath: '/cache/official/alpha/1.0.0',
        gitCommitSha: 'abc123',
      },
    ],
  )
})

void test('an entry without an install path is dropped rather than half-recorded', async () => {
  const home = await createTempPluginsHome({
    'installed_plugins.json': JSON.stringify({
      plugins: { 'alpha@official': [{ scope: 'user' }] },
    }),
  })

  assert.deepEqual(
    await readInstalledPlugins(join(home, 'installed_plugins.json')),
    [],
  )
})

void test('a corrupt installed file reads as empty instead of throwing', async () => {
  const home = await createTempPluginsHome({
    'installed_plugins.json': '{ not json',
  })

  assert.deepEqual(
    await readInstalledPlugins(join(home, 'installed_plugins.json')),
    [],
  )
})

void test('enabled plugins are read per profile as booleans', async () => {
  const home = await createTempPluginsHome({
    'settings.json': JSON.stringify({
      enabledPlugins: { 'alpha@official': true, 'beta@official': false },
    }),
  })

  assert.deepEqual(await readEnabledPlugins(join(home, 'settings.json')), {
    'alpha@official': true,
    'beta@official': false,
  })
})

void test('settings without enabledPlugins read as empty', async () => {
  const home = await createTempPluginsHome({
    'settings.json': JSON.stringify({ model: 'opus' }),
  })

  assert.deepEqual(await readEnabledPlugins(join(home, 'settings.json')), {})
})
