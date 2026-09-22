import assert from 'node:assert/strict'
import test from 'node:test'
import { buildReconciliationPrompt } from './buildReconciliationPrompt'

void test('the agent prompt requires live evidence and verbatim invariants', () => {
  const prompt = buildReconciliationPrompt(
    {
      version: 1,
      requiredInvariants: ['Required invariant.'],
      officialDocumentationOrigins: {
        claude: ['https://code.claude.com'],
        codex: ['https://developers.openai.com'],
      },
      maxOutputBytes: 20_000,
      agentCommand: ['/usr/bin/true'],
      timeoutMs: 120_000,
    },
    {
      hashes: { 'canonical/shared.md': 'a'.repeat(64) },
      values: { 'canonical/shared.md': 'Required invariant.\n' },
    },
  )

  assert.match(prompt, /Use live web search/u)
  assert.match(prompt, /query text literally includes/u)
  assert.match(prompt, /current UTC time/u)
  assert.match(prompt, /requiredInvariants string verbatim/u)
  assert.match(prompt, /semantic union/u)
})
