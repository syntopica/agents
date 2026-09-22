import assert from 'node:assert/strict'
import test from 'node:test'
import { createConvergedDomains } from './fixtures/createConvergedDomains'
import { isMachineProfile } from './isMachineProfile'
import { MACHINE_PROFILES } from './MACHINE_PROFILES'
import { selectProfileDomains } from './selectors/selectProfileDomains'

void test('the full profile selects every domain the diff can report', () => {
  const domains = createConvergedDomains()
  assert.deepEqual(
    selectProfileDomains({ profile: 'full', domains }).map(
      (domain) => domain.domain,
    ),
    ['mcp', 'security', 'capabilities', 'plugins', 'services'],
  )
})

void test('the lite profile drops the scheduled daemons', () => {
  const domains = createConvergedDomains()
  assert.equal(
    selectProfileDomains({ profile: 'lite', domains }).some(
      (domain) => domain.domain === 'services',
    ),
    false,
  )
})

void test('every domain named by a profile is a domain the diff can produce', () => {
  const domains = createConvergedDomains()
  const known = new Set(domains.map((domain) => domain.domain))

  for (const selected of Object.values(MACHINE_PROFILES)) {
    for (const domain of selected) assert.equal(known.has(domain), true, domain)
  }
})

void test('an unknown target is not a profile', () => {
  assert.equal(isMachineProfile('full'), true)
  assert.equal(isMachineProfile('lite'), true)
  assert.equal(isMachineProfile('laptop'), false)
  assert.equal(isMachineProfile(undefined), false)
})
