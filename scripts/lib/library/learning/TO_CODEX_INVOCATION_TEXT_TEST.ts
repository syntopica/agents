import assert from 'node:assert/strict'
import test from 'node:test'
import { toCodexInvocationText } from './toCodexInvocationText'

void test('a tool invocation yields its payload text', () => {
  const line = JSON.stringify({
    type: 'response_item',
    payload: { type: 'custom_tool_call', input: 'skillkit read brp-docs' },
  })

  assert.match(String(toCodexInvocationText(line)), /skillkit read brp-docs/)
})

void test('a function call is an invocation too', () => {
  const line = JSON.stringify({
    type: 'response_item',
    payload: {
      type: 'function_call',
      arguments: '{"command":"cat skills/pdf/SKILL.md"}',
    },
  })

  assert.match(String(toCodexInvocationText(line)), /SKILL\.md/)
})

void test('the injected skill catalogue is not an invocation', () => {
  const line = JSON.stringify({
    type: 'response_item',
    payload: {
      type: 'message',
      role: 'developer',
      content: [{ type: 'input_text', text: 'skillkit read brp-docs' }],
    },
  })

  assert.equal(toCodexInvocationText(line), undefined)
})

void test('command output that lists skills is not an invocation', () => {
  const line = JSON.stringify({
    type: 'response_item',
    payload: { type: 'custom_tool_call_output', output: 'skills/pdf/SKILL.md' },
  })

  assert.equal(toCodexInvocationText(line), undefined)
})

void test('a malformed line is ignored rather than throwing', () => {
  assert.equal(toCodexInvocationText('not json'), undefined)
  assert.equal(toCodexInvocationText(''), undefined)
})

void test('a null payload does not discard neighbouring skill invocations', () => {
  const payload = {
    type: 'custom_tool_call',
    input: 'skillkit read test-skill',
  }
  const invocation = JSON.stringify({ type: 'response_item', payload })
  const lines = [
    invocation,
    '{"type":"response_item","payload":null}',
    invocation,
  ]

  assert.deepEqual(lines.map(toCodexInvocationText), [
    JSON.stringify(payload),
    undefined,
    JSON.stringify(payload),
  ])
})
