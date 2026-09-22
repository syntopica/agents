import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveLearningDir } from './resolveLearningDir'

void test('raw observations default outside the library, which syncs to other machines', () => {
  assert.equal(
    resolveLearningDir({ env: {}, home: '/home/someone' }),
    '/home/someone/.agents-learning',
  )
})

void test('the flag wins over the environment', () => {
  assert.equal(
    resolveLearningDir({
      flag: '/opt/here',
      env: { AGENTS_LEARNING_DIR: '/opt/env' },
      home: '/h',
    }),
    '/opt/here',
  )
})

void test('an empty environment variable is treated as absent', () => {
  assert.equal(
    resolveLearningDir({
      env: { AGENTS_LEARNING_DIR: '' },
      home: '/home/someone',
    }),
    '/home/someone/.agents-learning',
  )
})
