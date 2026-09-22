import assert from 'node:assert/strict'
import test from 'node:test'
import { KEY_INDEX } from './fixtures/KEY_INDEX'
import { PROPOSAL_MANIFEST } from './fixtures/PROPOSAL_MANIFEST'
import { proposeChanges } from './proposeChanges'

void test('a covering skill that is parked is proposed for promotion', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'implement ui from screenshot',
        requests: 24,
        projects: 1,
        covers: 'frontend-design',
      },
    ],
    manifest: PROPOSAL_MANIFEST,
    invocations: {},
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  const promote = proposals.find((proposal) => proposal.kind === 'promote')
  assert.ok(promote)
  assert.equal(promote.skill, 'frontend-design')
  assert.equal(promote.requests, 24)
})

void test('a covering skill that is visible but never fired is a trigger problem', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'report status on task progress',
        requests: 42,
        projects: 1,
        covers: 'team-communications',
      },
    ],
    manifest: PROPOSAL_MANIFEST,
    invocations: {},
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.equal(
    proposals.find((proposal) => proposal.kind === 'fix-trigger')?.skill,
    'team-communications',
  )
})

void test('a covering skill that is visible and fired produces no proposal', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'draft slack reply',
        requests: 4,
        projects: 1,
        covers: 'team-communications',
      },
    ],
    manifest: PROPOSAL_MANIFEST,
    invocations: { 'team-communications': 4, 'old-thing': 1 },
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.deepEqual(proposals, [])
})

void test('a procedure nothing covers is a build candidate', () => {
  const proposals = proposeChanges({
    procedures: [{ name: 'read discord messages', requests: 8, projects: 4 }],
    manifest: PROPOSAL_MANIFEST,
    invocations: { 'team-communications': 1, 'old-thing': 1 },
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.equal(
    proposals.find((proposal) => proposal.kind === 'build')?.procedure,
    'read discord messages',
  )
})

void test('a covering skill absent from the library is also a build candidate', () => {
  const proposals = proposeChanges({
    procedures: [
      {
        name: 'sign pdf digitally',
        requests: 5,
        projects: 1,
        covers: 'not-installed',
      },
    ],
    manifest: PROPOSAL_MANIFEST,
    invocations: { 'team-communications': 1, 'old-thing': 1 },
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.equal(
    proposals.find((proposal) => proposal.kind === 'build')?.procedure,
    'sign pdf digitally',
  )
})

void test('an adopted skill nothing points at and nothing invoked is proposed for parking', () => {
  const proposals = proposeChanges({
    procedures: [],
    manifest: PROPOSAL_MANIFEST,
    invocations: { 'team-communications': 3 },
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.deepEqual(
    proposals
      .filter((proposal) => proposal.kind === 'park')
      .map((proposal) => proposal.skill),
    ['old-thing'],
  )
})

void test('proposals are ordered by measured volume, most first', () => {
  const proposals = proposeChanges({
    procedures: [
      { name: 'small', requests: 2, projects: 1 },
      { name: 'big', requests: 40, projects: 3 },
    ],
    manifest: PROPOSAL_MANIFEST,
    invocations: { 'team-communications': 1, 'old-thing': 1 },
    target: 'claude',
    keyIndex: KEY_INDEX,
  })
  assert.equal(proposals[0]?.procedure, 'big')
})
