import assert from 'node:assert/strict'
import test from 'node:test'
import { classifySkillPortability } from './classifySkillPortability'

void test('standard frontmatter is portable', () => {
  const finding = classifySkillPortability(
    '/library/portable/SKILL.md',
    '---\nname: portable\ndescription: Standard skill\nlicense: MIT\ncompatibility: node\nmetadata:\n  owner: test\n---\nBody\n',
  )
  assert.equal(finding.kind, 'portable')
})

void test('an indented multiline description is valid YAML', () => {
  const finding = classifySkillPortability(
    '/library/multiline/SKILL.md',
    '---\nname: multiline\ndescription:\n  A multiline description\n---\nBody\n',
  )
  assert.equal(finding.kind, 'portable')
})

void test('Anthropic fields are classified as a Claude extension', () => {
  for (const field of ['allowed-tools', 'argument-hint', 'paths']) {
    const finding = classifySkillPortability(
      `/library/${field}/SKILL.md`,
      `---\nname: claude-skill\ndescription: Claude extension\n${field}: value\n---\nBody\n`,
    )
    assert.equal(finding.kind, 'claude-extension')
  }
})

void test('command and triggers fields are target extensions', () => {
  const finding = classifySkillPortability(
    '/library/target/SKILL.md',
    '---\nname: target-skill\ndescription: Target extension\ncommand: run\ntriggers: [one]\n---\nBody\n',
  )
  assert.equal(finding.kind, 'target-extension')
})

void test('a namespaced logical name is a target extension', () => {
  const finding = classifySkillPortability(
    '/library/namespaced/SKILL.md',
    '---\nname: superpowers:systematic-debugging\ndescription: Namespaced skill\n---\nBody\n',
  )
  assert.equal(finding.kind, 'target-extension')
})

void test('fixture paths are explained instead of reported as invalid', () => {
  const finding = classifySkillPortability(
    '/library/fixtures/broken/SKILL.md',
    'not yaml',
  )
  assert.equal(finding.kind, 'fixture')
})

void test('malformed YAML and unknown fields are invalid', () => {
  assert.equal(
    classifySkillPortability(
      '/library/broken/SKILL.md',
      '---\nname broken\n---\nBody',
    ).kind,
    'invalid',
  )
  assert.equal(
    classifySkillPortability(
      '/library/unknown/SKILL.md',
      '---\nname: unknown\ndescription: Unknown field\nimaginary: true\n---\nBody',
    ).kind,
    'invalid',
  )
})
