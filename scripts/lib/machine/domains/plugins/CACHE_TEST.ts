import assert from 'node:assert/strict'
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'
import { findOrphanCacheDirectories } from './findOrphanCacheDirectories'
import { findStaleCacheEntries } from './findStaleCacheEntries'
import { createTempCacheDirectory } from './fixtures/createTempCacheDirectory'
import { officialMarketplace } from './fixtures/officialMarketplace'
import { readCacheEntries } from './readCacheEntries'
import { readSettingsReferencedCachePaths } from './readSettingsReferencedCachePaths'
import { resolveInstalledPaths } from './resolveInstalledPaths'

void test('cache entries are read at marketplace/plugin/version depth', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['official', 'alpha', '1.0.0'],
    ['official', 'alpha', '2.0.0'],
  ])

  assert.deepEqual(
    (
      await readCacheEntries({ cacheDir, marketplaces: officialMarketplace })
    ).map((entry) => entry.version),
    ['1.0.0', '2.0.0'],
  )
})

void test('a directory outside the known marketplaces is not walked as a cache entry', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['temp_git_1786198673992_ggfln8', 'skills', 'brainstorming'],
  ])

  assert.deepEqual(
    await readCacheEntries({ cacheDir, marketplaces: officialMarketplace }),
    [],
  )
})

void test('a missing cache directory reads as empty instead of throwing', async () => {
  assert.deepEqual(
    await readCacheEntries({
      cacheDir: '/nonexistent/cache',
      marketplaces: officialMarketplace,
    }),
    [],
  )
})

void test('versions no installed plugin resolves to are reported stale', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['official', 'alpha', '1.0.0'],
    ['official', 'alpha', '2.0.0'],
  ])
  const entries = await readCacheEntries({
    cacheDir,
    marketplaces: officialMarketplace,
  })

  const stale = findStaleCacheEntries({
    entries,
    referencedPaths: await resolveInstalledPaths([
      {
        id: 'alpha@official',
        scope: 'user',
        version: '2.0.0',
        installPath: join(cacheDir, 'official', 'alpha', '2.0.0'),
      },
    ]),
  })

  assert.deepEqual(
    stale.map((entry) => entry.version),
    ['1.0.0'],
  )
})

void test('cache directories belonging to no known marketplace are reported orphan', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['official', 'alpha', '1.0.0'],
    ['temp_git_1786198673992_ggfln8'],
  ])

  assert.deepEqual(
    await findOrphanCacheDirectories({
      cacheDir,
      marketplaces: officialMarketplace,
    }),
    [join(cacheDir, 'temp_git_1786198673992_ggfln8')],
  )
})

void test('a version reached through a symlinked profile directory is not reported stale', async () => {
  const cacheDir = await createTempCacheDirectory([
    ['official', 'alpha', '1.0.0'],
  ])
  const linkDir = join(cacheDir, '..', `${basename(cacheDir)}-link`)
  await symlink(cacheDir, linkDir, 'dir')

  const stale = findStaleCacheEntries({
    entries: await readCacheEntries({
      cacheDir,
      marketplaces: officialMarketplace,
    }),
    referencedPaths: await resolveInstalledPaths([
      {
        id: 'alpha@official',
        scope: 'user',
        version: '1.0.0',
        installPath: join(linkDir, 'official', 'alpha', '1.0.0'),
      },
    ]),
  })

  assert.deepEqual(stale, [])
})

void test('an install path that no longer exists stays stale rather than throwing', async () => {
  assert.deepEqual(
    await resolveInstalledPaths([
      {
        id: 'alpha@official',
        scope: 'user',
        version: '1.0.0',
        installPath: '/nonexistent/alpha',
      },
    ]),
    ['/nonexistent/alpha'],
  )
})

void test('a cache version a settings file points at is not stale', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rocket-agents-cache-refs-'))
  try {
    const cacheDir = join(root, 'plugins', 'cache')
    const referenced = join(cacheDir, 'market', 'statusline', '1.4.0')
    const settings = join(root, 'settings.json')
    await mkdir(referenced, { recursive: true })
    await writeFile(
      settings,
      JSON.stringify({
        statusLine: { command: `node ${referenced}/bin/status.js` },
      }),
    )

    const paths = await readSettingsReferencedCachePaths({
      settingsFiles: [settings, join(root, 'absent.json')],
      cacheDirs: [cacheDir],
    })
    assert.deepEqual(paths, [await realpath(referenced)])

    const entries = [
      {
        marketplace: 'market',
        plugin: 'statusline',
        version: '1.4.0',
        path: await realpath(referenced),
      },
      {
        marketplace: 'market',
        plugin: 'statusline',
        version: '1.3.0',
        path: join(await realpath(cacheDir), 'market', 'statusline', '1.3.0'),
      },
    ]
    assert.deepEqual(
      findStaleCacheEntries({ entries, referencedPaths: paths }).map(
        ({ version }) => version,
      ),
      ['1.3.0'],
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
