import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { apply } from './apply'
import { createTempTargetPaths } from './fixtures/createTempTargetPaths'
import { EMPTY_OWNED } from './fixtures/EMPTY_OWNED'
import { loadCanonicalManifest } from './fixtures/loadCanonicalManifest'
import { TEST_ENV } from './fixtures/TEST_ENV'
import { plan } from './plan'
import { read } from './read'
import type { McpManifest } from './types/McpManifest'

void test('a second apply changes nothing', async () => {
  const paths = await createTempTargetPaths()
  const manifest = await loadCanonicalManifest()

  const first = await apply({
    manifest,
    paths,
    owned: EMPTY_OWNED,
    env: TEST_ENV,
  })
  const afterFirst = await readFile(paths['claude-personal'], 'utf8')
  const afterFirstCodex = await readFile(paths.codex, 'utf8')
  assert.match(
    afterFirstCodex,
    /\[mcp_servers\.atrium\]\ncommand = "[^"]+"\nargs = \[.+\]\nrequired = true\ndefault_tools_approval_mode = "writes"/,
  )

  const second = await apply({
    manifest,
    paths,
    owned: first.owned,
    env: TEST_ENV,
  })

  assert.equal(await readFile(paths['claude-personal'], 'utf8'), afterFirst)
  assert.equal(await readFile(paths.codex, 'utf8'), afterFirstCodex)

  const changes = plan({
    manifest,
    state: await read(paths),
    owned: second.owned,
    env: TEST_ENV,
  })
  assert.deepEqual(changes, [])
})

void test('a foreign key added between runs is not disturbed', async () => {
  const paths = await createTempTargetPaths()
  const manifest = await loadCanonicalManifest()

  const first = await apply({
    manifest,
    paths,
    owned: EMPTY_OWNED,
    env: TEST_ENV,
  })

  const config = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as {
    mcpServers: Record<string, unknown>
  }
  config.mcpServers['injectedByAnotherTool'] = { type: 'stdio', command: 'x' }
  await writeFile(paths['claude-personal'], JSON.stringify(config, null, 2))

  await apply({ manifest, paths, owned: first.owned, env: TEST_ENV })

  const after = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as {
    mcpServers: Record<string, unknown>
  }
  assert.equal('injectedByAnotherTool' in after.mcpServers, true)
})

void test('a foreign codex block added between runs is not disturbed', async () => {
  const paths = await createTempTargetPaths()
  const manifest = await loadCanonicalManifest()

  const first = await apply({
    manifest,
    paths,
    owned: EMPTY_OWNED,
    env: TEST_ENV,
  })

  const current = await readFile(paths.codex, 'utf8')
  await writeFile(
    paths.codex,
    `${current}\n[mcp_servers.someoneElse]\ncommand = "keep"\n`,
  )

  await apply({ manifest, paths, owned: first.owned, env: TEST_ENV })

  const after = await readFile(paths.codex, 'utf8')
  assert.match(after, /\[mcp_servers\.someoneElse\]/)
  assert.match(after, /model = "gpt-5\.6-sol"/)
})

void test('dropping a server from the manifest removes it from every target', async () => {
  const paths = await createTempTargetPaths()
  const manifest = await loadCanonicalManifest()

  const first = await apply({
    manifest,
    paths,
    owned: EMPTY_OWNED,
    env: TEST_ENV,
  })

  const reduced: McpManifest = { servers: {} }
  for (const [name, server] of Object.entries(manifest.servers)) {
    if (name !== 'codegraph') {
      reduced.servers[name] = server
    }
  }

  await apply({ manifest: reduced, paths, owned: first.owned, env: TEST_ENV })

  const claude = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as {
    mcpServers: Record<string, unknown>
  }
  assert.equal('codegraph' in claude.mcpServers, false)
  assert.equal(
    (await readFile(paths.codex, 'utf8')).includes('mcp_servers.codegraph'),
    false,
  )
})

void test('a missing secret leaves the server out and is reported', async () => {
  const paths = await createTempTargetPaths()
  const manifest = await loadCanonicalManifest()

  const result = await apply({ manifest, paths, owned: EMPTY_OWNED, env: {} })
  assert.equal(result.missing.includes('CONTEXT7_API_KEY'), true)

  const claude = JSON.parse(
    await readFile(paths['claude-personal'], 'utf8'),
  ) as {
    mcpServers: Record<string, unknown>
  }
  assert.equal('context7' in claude.mcpServers, false)
  assert.equal('serena' in claude.mcpServers, true)
})
