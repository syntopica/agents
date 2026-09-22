import assert from 'node:assert/strict'
import test from 'node:test'
import { REQUIRED_SUPERPOWERS_SKILLS } from './constants/REQUIRED_SUPERPOWERS_SKILLS'
import { parseSkillSourceManifest } from './parseSkillSourceManifest'
import { planSkillSourceApply } from './planSkillSourceApply'
import { planSkillSourceInstall } from './planSkillSourceInstall'

void test('floating skill sources are rejected', () => {
  const parsed = parseSkillSourceManifest({
    version: 1,
    sources: [
      {
        id: 'superpowers',
        source: 'obra/superpowers',
        skills: REQUIRED_SUPERPOWERS_SKILLS,
        targets: ['codex'],
      },
    ],
  })

  assert.equal(parsed.ok, false)
  assert.equal(
    parsed.errors.some((error) => error.includes('resolvedCommit')),
    true,
  )
})

void test('the pinned Superpowers source produces the reviewed install command', () => {
  const parsed = parseSkillSourceManifest({
    version: 1,
    sources: [
      {
        id: 'superpowers',
        source: 'obra/superpowers',
        resolvedCommit: 'b36e0829c6d0140e93cfef2ca599b1b07d4a7797',
        skills: REQUIRED_SUPERPOWERS_SKILLS,
        targets: ['claude', 'codex', 'gemini-cli'],
      },
    ],
  })

  assert.equal(parsed.ok, true)
  const source = parsed.manifest.sources.at(0)
  assert.ok(source)
  assert.deepEqual(planSkillSourceInstall(source), [
    'install',
    'obra/superpowers',
    `--skills=${REQUIRED_SUPERPOWERS_SKILLS.join(',')}`,
    '--global',
    '--yes',
    '--scan',
    '--json',
  ])
})

void test('a reviewed pinned finding keeps scanning enabled and adds force only for apply', () => {
  const source = {
    id: 'superpowers',
    source: 'obra/superpowers',
    resolvedCommit: 'b36e0829c6d0140e93cfef2ca599b1b07d4a7797',
    skills: ['brainstorming'],
    targets: ['codex'],
    securityExceptions: [
      {
        skill: 'brainstorming',
        ruleId: 'CI003',
        file: 'scripts/server.cjs',
        line: 537,
        reason:
          'Pinned opt-in browser launcher reviewed against the exact source commit.',
      },
    ],
  }

  assert.deepEqual(planSkillSourceApply(source).slice(-3), [
    '--scan',
    '--json',
    '--force',
  ])
})
