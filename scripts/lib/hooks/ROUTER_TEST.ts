import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { LANE_MARKERS } from './constants/LANE_MARKERS'
import { ROUTER_FIXTURES } from './constants/ROUTER_FIXTURES'
import { runRouterHook } from './runRouterHook'

/**
 * Exercises the shipped hook end to end. Fixtures are verbatim transcript
 * prompts, so a passing run means the router handles prompts the user actually
 * sends - unlike the previous activation fixtures, which paraphrased the skill
 * descriptions and were never executed by any test.
 */

void test('every real prompt reaches its lane', () => {
  const routedCount = Object.values(ROUTER_FIXTURES.routes).flat().length
  assert.equal(
    routedCount + ROUTER_FIXTURES.silent.prompts.length,
    ROUTER_FIXTURES.phraseCount,
  )
  assert.equal(ROUTER_FIXTURES.sourceAssociationCount, 113)
  for (const [lane, prompts] of Object.entries(ROUTER_FIXTURES.routes)) {
    const marker = LANE_MARKERS[lane]
    assert.ok(marker, `no marker configured for lane ${lane}`)

    for (const prompt of prompts) {
      const directive = runRouterHook(prompt)
      assert.notEqual(
        directive,
        null,
        `expected ${lane}, got silence for: ${prompt}`,
      )
      assert.match(
        String(directive),
        new RegExp(marker),
        `wrong lane for: ${prompt}`,
      )
    }
  }
})

void test('acknowledgements and ordinary work stay silent', () => {
  for (const prompt of ROUTER_FIXTURES.silent.prompts) {
    assert.equal(runRouterHook(prompt), null, `expected silence for: ${prompt}`)
  }
})

void test('a lane fires at most once per session', () => {
  const prompt = ROUTER_FIXTURES.routes['debug']?.[0]
  assert.ok(prompt, 'debug lane needs at least one fixture prompt')
  const first = `router-test-${randomUUID()}`
  const second = `router-test-${randomUUID()}`
  try {
    assert.notEqual(
      runRouterHook(prompt, first),
      null,
      'first prompt in a session must route',
    )
    assert.equal(
      runRouterHook(prompt, first),
      null,
      'repeat in the same session must stay silent',
    )
    assert.notEqual(
      runRouterHook(prompt, second),
      null,
      'a new session must route again',
    )
  } finally {
    for (const id of [first, second]) {
      rmSync(path.join(tmpdir(), `claude-skill-router-${id}`), { force: true })
    }
  }
})

void test('machine-generated payloads never route', () => {
  assert.equal(
    runRouterHook('<task-notification>done</task-notification>'),
    null,
  )
})

void test('malformed stdin does not crash the hook', () => {
  const hook = path.join(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
    'src/hooks/user-prompt-skill-router.sh',
  )
  assert.equal(
    execFileSync('bash', [hook], {
      input: 'not json',
      encoding: 'utf8',
    }).trim(),
    '',
  )
})
