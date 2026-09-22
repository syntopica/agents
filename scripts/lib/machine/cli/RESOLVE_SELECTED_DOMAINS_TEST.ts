import assert from 'node:assert/strict'
import test from 'node:test'
import { MACHINE_PROFILES } from '../profiles/MACHINE_PROFILES'
import { resolveSelectedDomains } from './resolveSelectedDomains'

void test('without --domain a run converges the whole profile', () => {
  assert.deepEqual(
    resolveSelectedDomains({
      argv: ['node', 'apply', '--profile', 'full'],
      profileDomains: MACHINE_PROFILES.full,
    }),
    { domains: [...MACHINE_PROFILES.full] },
  )
})

void test('--domain narrows the run and repeats without duplicating', () => {
  assert.deepEqual(
    resolveSelectedDomains({
      argv: ['--domain', 'plugins', '--domain', 'plugins', '--domain', 'mcp'],
      profileDomains: MACHINE_PROFILES.full,
    }),
    { domains: ['plugins', 'mcp'] },
  )
})

void test('a domain outside the profile is refused, never silently dropped', () => {
  const outcome = resolveSelectedDomains({
    argv: ['--domain', 'services'],
    profileDomains: MACHINE_PROFILES.lite,
  })
  assert.equal('errors' in outcome, true)
  if (!('errors' in outcome)) return
  assert.match(outcome.errors[0] ?? '', /unknown domain services/)
})
