import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parseConnectorManifest } from './parseConnectorManifest'

// The fixture, not `examples/machine/connectors.json`: that file is this
// machine's own manifest, untracked on purpose, so a clone without it used to
// fail here for a reason that has nothing to do with the parser.
void test('a connector manifest is valid and profile explicit', async () => {
  const raw = JSON.parse(
    await readFile(
      'scripts/lib/connectors/fixtures/connectorManifestExample.json',
      'utf8',
    ),
  ) as unknown
  const parsed = parseConnectorManifest(raw)
  assert.equal(parsed.ok, true)
  assert.deepEqual(
    parsed.manifest.connectors.find(({ id }) => id === 'gateway-example')
      ?.profiles,
    ['claude-personal'],
  )
  assert.deepEqual(
    parsed.manifest.connectors.find(({ id }) => id === 'memstore'),
    {
      id: 'memstore',
      match: 'memstore',
      profiles: ['codex'],
      ownership: 'machine',
      probe: 'native-cli',
      criticality: 'required',
    },
  )
})

void test('credential fields, literals, and token query parameters are rejected', () => {
  const parsed = parseConnectorManifest({
    version: 1,
    connectors: [
      {
        id: 'unsafe',
        match: 'unsafe',
        profiles: ['claude-personal'],
        ownership: 'account',
        probe: 'http-mcp',
        criticality: 'required',
        endpoint: 'https://example.test/mcp?token=hidden',
        headers: { Authorization: 'Bearer hidden' },
        cookie: 'session=hidden',
      },
    ],
  })
  assert.equal(parsed.ok, false)
  assert.ok(
    parsed.errors.some((error) => error.includes('credential-shaped field')),
  )
  assert.ok(
    parsed.errors.some((error) => error.includes('credential query parameter')),
  )
})

void test('unknown profiles and missing probe policy are rejected', () => {
  const parsed = parseConnectorManifest({
    version: 1,
    connectors: [
      {
        id: 'unknown',
        match: 'unknown',
        profiles: ['other'],
        ownership: 'account',
        criticality: 'optional',
      },
    ],
  })
  assert.equal(parsed.ok, false)
  assert.ok(parsed.errors.some((error) => error.includes('profiles')))
  assert.ok(parsed.errors.some((error) => error.includes('probe')))
})
