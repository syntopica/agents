import assert from 'node:assert/strict'
import test from 'node:test'
import { looksLikeRandomToken } from './looksLikeRandomToken'

void test('a mixed-case token with digits and symbols reads as a secret', () => {
  assert.equal(looksLikeRandomToken('Kd%L6zwCMuo&p2As96s'), true)
})

void test('an ordinary word is not a secret', () => {
  assert.equal(looksLikeRandomToken('configuracion'), false)
})

void test('a short mixed string is not long enough to be one', () => {
  assert.equal(looksLikeRandomToken('Ab3$'), false)
})

void test('a file path is not treated as a secret', () => {
  assert.equal(looksLikeRandomToken('/Users/someone/p/project'), false)
})

void test('a long sentence fragment is rejected by the length ceiling', () => {
  assert.equal(looksLikeRandomToken('x'.repeat(200)), false)
})

void test('a model name with digits and dashes is not a secret', () => {
  assert.equal(looksLikeRandomToken('gemini-3.1-pro-high'), false)
})

void test('a path with a version in it is not a secret', () => {
  assert.equal(looksLikeRandomToken('/opt/homebrew/bin/node20'), false)
})

void test('a token needs a digit before it can look random', () => {
  assert.equal(looksLikeRandomToken('SomeMixed%Symbols&Here'), false)
})
