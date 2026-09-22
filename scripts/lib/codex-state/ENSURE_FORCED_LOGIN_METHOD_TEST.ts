import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureForcedLoginMethod } from './ensureForcedLoginMethod'

void test('the forced login method is inserted before the first TOML table', () => {
  const result = ensureForcedLoginMethod(
    'model = "gpt-5.6-sol"\n\n[mcp_servers.context7]\nurl = "https://example.test"\n',
  )

  assert.equal(result.ok, true)
  assert.equal(result.changed, true)
  assert.equal(
    result.contents,
    'model = "gpt-5.6-sol"\nforced_login_method = "chatgpt"\n\n[mcp_servers.context7]\nurl = "https://example.test"\n',
  )
})

void test('an API login restriction is replaced while comments survive', () => {
  const result = ensureForcedLoginMethod(
    '# Keep this comment\nforced_login_method = "api" # managed auth\nmodel = "gpt-5.6-sol"\n',
  )

  assert.equal(result.ok, true)
  assert.equal(
    result.contents,
    '# Keep this comment\nforced_login_method = "chatgpt" # managed auth\nmodel = "gpt-5.6-sol"\n',
  )
})

void test('an already converged file is byte-identical', () => {
  const contents =
    'forced_login_method = "chatgpt"\n\n[features]\napps = true\n'
  const result = ensureForcedLoginMethod(contents)

  assert.deepEqual(result, { ok: true, contents, changed: false })
})

void test('duplicate assignments are rejected without rewriting', () => {
  const result = ensureForcedLoginMethod(
    'forced_login_method = "api"\nforced_login_method = "chatgpt"\n',
  )

  assert.deepEqual(result, {
    ok: false,
    errors: ['forced_login_method must appear at most once'],
  })
})

void test('a table-local assignment is rejected as unsafe', () => {
  const result = ensureForcedLoginMethod(
    '[profile.work]\nforced_login_method = "chatgpt"\n',
  )

  assert.deepEqual(result, {
    ok: false,
    errors: ['forced_login_method must be a top-level setting'],
  })
})
