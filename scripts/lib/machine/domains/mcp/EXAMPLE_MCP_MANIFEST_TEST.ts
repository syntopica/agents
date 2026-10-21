import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parseMcpManifest } from './parseMcpManifest'

void test('the public MCP example satisfies the manifest schema', async () => {
  const parsed = parseMcpManifest(
    JSON.parse(
      await readFile(
        new URL('../../../../../examples/machine/mcp.json', import.meta.url),
        'utf8',
      ),
    ) as unknown,
  )

  assert.equal(parsed.ok, true)
})
