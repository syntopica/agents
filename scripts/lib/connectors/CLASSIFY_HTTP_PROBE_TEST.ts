import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyHttpProbe } from './classifyHttpProbe'

void test('MCP initialize output is healthy', () => {
  const result = classifyHttpProbe({
    httpCode: 200,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'probe',
      result: { protocolVersion: '2025-06-18' },
    }),
    retryAfter: null,
    durationMs: 5,
  })
  assert.equal(result.status, 'healthy')
})

void test('authentication, throttling, and upstream failures stay distinct', () => {
  assert.equal(
    classifyHttpProbe({
      httpCode: 401,
      body: '',
      retryAfter: null,
      durationMs: 1,
    }).status,
    'auth-required',
  )
  const limited = classifyHttpProbe({
    httpCode: 429,
    body: '',
    retryAfter: '12',
    durationMs: 1,
  })
  assert.equal(limited.status, 'degraded')
  assert.equal(limited.retryAfterSeconds, 12)
  assert.equal(
    classifyHttpProbe({
      httpCode: 503,
      body: '',
      retryAfter: null,
      durationMs: 1,
    }).status,
    'failed',
  )
})

void test('invalid JSON and non-MCP success bodies fail protocol validation', () => {
  assert.equal(
    classifyHttpProbe({
      httpCode: 200,
      body: 'not-json',
      retryAfter: null,
      durationMs: 1,
    }).summary,
    'response is not valid JSON',
  )
  assert.equal(
    classifyHttpProbe({
      httpCode: 200,
      body: '{}',
      retryAfter: null,
      durationMs: 1,
    }).summary,
    'response is not MCP initialize output',
  )
})
