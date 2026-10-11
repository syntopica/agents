import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTargetPaths } from './resolveTargetPaths'

void test('resolveTargetPaths puts the secondary target in the declared profile directory', () => {
  assert.equal(
    resolveTargetPaths('/home/u', {
      CLAUDE_SECONDARY_CONFIG_DIR: '.claude-work',
    })['claude-secondary'],
    '/home/u/.claude-work/.claude.json',
  )
})

void test('resolveTargetPaths falls back to the neutral secondary directory', () => {
  assert.equal(
    resolveTargetPaths('/home/u', {})['claude-secondary'],
    '/home/u/.claude-secondary/.claude.json',
  )
})
