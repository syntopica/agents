import assert from 'node:assert/strict'
import test from 'node:test'
import { createPluginsCapture } from './fixtures/createPluginsCapture'
import { parsePluginsManifest } from './parsePluginsManifest'
import { toDeclaredPluginsManifest } from './toDeclaredPluginsManifest'

void test('a capture converts into a manifest its own parser accepts', () => {
  const parsed = parsePluginsManifest(
    toDeclaredPluginsManifest(createPluginsCapture()),
  )

  assert.equal(parsed.ok, true)
})

void test('undeclared collapses to false, since settings that never enable it do not enable it', () => {
  const document = toDeclaredPluginsManifest(createPluginsCapture())

  assert.deepEqual(document.plugins[0]?.enabled, {
    'claude-personal': true,
    'claude-secondary': false,
  })
  assert.deepEqual(document.plugins[1]?.enabled, {
    'claude-personal': false,
    'claude-secondary': true,
  })
})

void test('marketplaces and versions survive the conversion unchanged', () => {
  const capture = createPluginsCapture()
  const document = toDeclaredPluginsManifest(capture)

  assert.equal(document.version, 1)
  assert.deepEqual(document.marketplaces, capture.marketplaces)
  assert.deepEqual(
    document.plugins.map((plugin) => plugin.version),
    ['1.0.0', '2.0.0'],
  )
})
