import assert from 'node:assert/strict'
import test from 'node:test'
import { deduplicatePlannedLinks } from './deduplicatePlannedLinks'

void test('the same skill reached through a bundle and directly is planned once', () => {
  const link = {
    name: 'brain',
    target: '/library/skills/core/brain',
    entryKey: 'core/brain',
    logicalName: 'core/brain',
  }

  assert.deepEqual(deduplicatePlannedLinks([link, { ...link }]), [link])
})

void test('same-name links from distinct skills remain visible to collision checks', () => {
  const links = [
    {
      name: 'review',
      target: '/a',
      entryKey: 'a/review',
      logicalName: 'a/review',
    },
    {
      name: 'review',
      target: '/b',
      entryKey: 'b/review',
      logicalName: 'b/review',
    },
  ]

  assert.deepEqual(deduplicatePlannedLinks(links), links)
})
