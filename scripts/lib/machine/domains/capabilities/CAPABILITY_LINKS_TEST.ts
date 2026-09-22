import assert from 'node:assert/strict'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { applyCapabilityLinks } from './applyCapabilityLinks'
import { planCapabilityLinks } from './planCapabilityLinks'
import type { CapabilityTarget } from './types/CapabilityTarget'
import { verifyCapabilityLinks } from './verifyCapabilityLinks'

void test('capability links plan, apply, verify, and converge', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'capability-links-'))
  const source = join(dir, 'source')
  const targetPath = join(dir, 'client', 'rules')
  await mkdir(source)
  await writeFile(join(source, 'rule.md'), 'rule')
  const target: CapabilityTarget = {
    id: 'client-rules',
    capability: 'rules',
    support: 'supported',
    detectPaths: [dir],
    links: [{ source, target: targetPath, method: 'symlink' }],
  }

  assert.deepEqual(await planCapabilityLinks(target), [
    { target: targetPath, operation: 'add' },
  ])
  assert.equal((await applyCapabilityLinks(target)).linked, 1)
  assert.deepEqual(await planCapabilityLinks(target), [])
  assert.equal((await verifyCapabilityLinks(target))[0]?.status, 'healthy')
})

void test('verification reports stale and broken links', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'capability-stale-'))
  const expected = join(dir, 'expected')
  const other = join(dir, 'other')
  const stale = join(dir, 'stale')
  const broken = join(dir, 'broken')
  await mkdir(expected)
  await mkdir(other)
  await symlink(other, stale)
  await symlink(join(dir, 'missing'), broken)
  const staleTarget: CapabilityTarget = {
    id: 'stale',
    capability: 'skills',
    support: 'supported',
    detectPaths: [dir],
    links: [{ source: expected, target: stale, method: 'symlink' }],
  }
  const brokenTarget: CapabilityTarget = {
    id: 'broken',
    capability: 'skills',
    support: 'supported',
    detectPaths: [dir],
    links: [{ source: expected, target: broken, method: 'symlink' }],
  }

  assert.equal((await verifyCapabilityLinks(staleTarget))[0]?.status, 'stale')
  assert.equal((await verifyCapabilityLinks(brokenTarget))[0]?.status, 'broken')
})

void test('unsupported capabilities remain visible and are never applied', async () => {
  const target: CapabilityTarget = {
    id: 'client-plugins',
    capability: 'plugins',
    support: 'unsupported',
    reason: 'No compatible plugin declaration mechanism',
    detectPaths: [],
    links: [],
  }
  assert.equal((await applyCapabilityLinks(target)).status, 'unsupported')
  assert.equal((await verifyCapabilityLinks(target))[0]?.status, 'unsupported')
})
