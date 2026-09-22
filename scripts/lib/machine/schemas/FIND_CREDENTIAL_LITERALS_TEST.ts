import assert from 'node:assert/strict'
import test from 'node:test'
import { findCredentialLiterals } from './findCredentialLiterals'

void test('a clean stdio server produces no findings', () => {
  const findings = findCredentialLiterals({
    args: [
      '--from',
      'git+https://github.com/oraios/serena',
      'serena',
      'start-mcp-server',
    ],
  })
  assert.deepEqual(findings, [])
})

void test('a reference in env is accepted', () => {
  const findings = findCredentialLiterals({
    env: { CONTEXT7_API_KEY: { from_env: 'CONTEXT7_API_KEY' } },
  })
  assert.deepEqual(findings, [])
})

void test('a literal token in env is rejected', () => {
  const findings = findCredentialLiterals({
    env: { GITHUB_TOKEN: 'ghp_0000000000000000000000000000000000' },
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /env\.GITHUB_TOKEN/)
})

void test('a literal in headers is rejected', () => {
  const findings = findCredentialLiterals({
    headers: { CONTEXT7_API_KEY: 'ctx7sk-0000000000' },
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /headers\.CONTEXT7_API_KEY/)
})

void test('a connection string with inline credentials in args is rejected', () => {
  const findings = findCredentialLiterals({
    args: [
      '-y',
      'mongodb-mcp-server',
      '--connectionString',
      'mongodb+srv://user:pass@cluster/',
      '--readOnly',
    ],
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /args\[3\]/)
})

void test('a bare high-entropy token as a positional argument is rejected', () => {
  const findings = findCredentialLiterals({
    args: [
      'mcp-remote',
      'https://api.browser-use.com/mcp',
      '--header',
      'aBcD1234eFgH5678iJkL9012mNoP3456',
    ],
  })
  assert.equal(findings.length, 1)
  assert.match(findings[0] ?? '', /args\[3\]/)
})

void test('a bare uuid token is rejected', () => {
  const findings = findCredentialLiterals({
    env: { API_TOKEN: '5225ec8c-0e29-4a1b-9f3e-7c2d8e6b0a14' },
  })
  assert.equal(findings.length, 1)
})

void test('flags, transports, package names and clean urls are allowed', () => {
  const findings = findCredentialLiterals({
    args: [
      '-y',
      '--transport',
      'stdio',
      '@brave/brave-search-mcp-server',
      'https://mcp.context7.com/mcp',
    ],
  })
  assert.deepEqual(findings, [])
})

void test('every offending location is reported, not just the first', () => {
  const findings = findCredentialLiterals({
    env: {
      A: 'aBcD1234eFgH5678iJkL9012mNoP3456',
      B: 'qRsT7890uVwX1234yZaB5678cDeF9012',
    },
  })
  assert.equal(findings.length, 2)
})

void test('a non-string value that is not a reference is rejected', () => {
  const findings = findCredentialLiterals({ env: { PORT: 3100 } })
  assert.equal(findings.length, 1)
  assert.match(
    findings[0] ?? '',
    /must be a string or a \{ from_env \} reference/,
  )
})
