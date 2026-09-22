import assert from 'node:assert/strict'
import test from 'node:test'
import { toTranscriptLine as line } from './fixtures/toTranscriptLine'
import { readTranscriptTurns } from './readTranscriptTurns'

void test('a plain user turn is observed', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: { role: 'user', content: 'arregla el header en movil' },
    }),
  )
  assert.deepEqual(turns, [{ text: 'arregla el header en movil' }])
})

void test('text blocks are joined and non-text blocks ignored', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'haz esto' }, { type: 'image' }],
      },
    }),
  )
  assert.deepEqual(turns, [{ text: 'haz esto' }])
})

void test('a machine-written turn is dropped', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      message: { role: 'user', content: 'Stop hook feedback: gate FAILED' },
    }),
  )
  assert.deepEqual(turns, [])
})

void test('sidechain turns are dropped, because they are the agent talking to itself', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'user',
      isSidechain: true,
      message: { role: 'user', content: 'do it' },
    }),
  )
  assert.deepEqual(turns, [])
})

void test('a skill invocation is observed with its name', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Skill',
            input: { skill: 'brp-todo-work' },
          },
        ],
      },
    }),
  )
  assert.deepEqual(turns, [{ text: '', invokedSkill: 'brp-todo-work' }])
})

void test('a non-Skill tool call is not counted as an invocation', () => {
  const turns = readTranscriptTurns(
    line({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }],
      },
    }),
  )
  assert.deepEqual(turns, [])
})

void test('unparseable lines are skipped rather than throwing', () => {
  assert.deepEqual(readTranscriptTurns('{ not json\n'), [])
})

void test('a request and the invocation it caused are both observed, in order', () => {
  const contents = [
    line({
      type: 'user',
      message: { role: 'user', content: 'ejecuta el backlog' },
    }),
    line({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            name: 'Skill',
            input: { skill: 'brp-todo-work' },
          },
        ],
      },
    }),
  ].join('\n')

  assert.deepEqual(readTranscriptTurns(contents), [
    { text: 'ejecuta el backlog' },
    { text: '', invokedSkill: 'brp-todo-work' },
  ])
})
