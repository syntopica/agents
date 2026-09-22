import assert from 'node:assert/strict'
import test from 'node:test'
import { readSafeAgentDiagnostic } from './readSafeAgentDiagnostic'

void test('only the fixed guidance evidence diagnostic is exposed', () => {
  assert.equal(
    readSafeAgentDiagnostic(
      Buffer.from(
        'Agent guidance reconciler: Agent guidance evidence: missing official claude web search event.\n',
      ),
    ),
    'Agent guidance reconciler: Agent guidance evidence: missing official claude web search event.',
  )
  assert.equal(
    readSafeAgentDiagnostic(Buffer.from('token=secret-material\n')),
    undefined,
  )
})
