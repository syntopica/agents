import assert from 'node:assert/strict'
import test from 'node:test'
import { renderCodexAgent } from './renderCodexAgent'

void test('a Claude subagent becomes a Codex custom agent', () => {
  const rendered = renderCodexAgent(`---
name: reviewer
description:
  Review completed changes. Do not use for implementation.
tools: Read, Bash
model: sonnet
---

Inspect the full diff and return findings first.
`)

  assert.equal(
    rendered,
    [
      'name = "reviewer"',
      'description = "Review completed changes. Do not use for implementation."',
      'developer_instructions = "Inspect the full diff and return findings first."',
      '',
    ].join('\n'),
  )
  assert.equal(rendered.includes('sonnet'), false)
  assert.equal(rendered.includes('tools'), false)
})
