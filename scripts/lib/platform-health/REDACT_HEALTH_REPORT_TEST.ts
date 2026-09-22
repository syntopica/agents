import assert from 'node:assert/strict'
import test from 'node:test'
import { redactHealthReport } from './redactHealthReport'
import type { PlatformHealth } from './types/PlatformHealth'

void test('health reports redact homes, bearer values, and secret prefixes', () => {
  const report: PlatformHealth[] = [
    {
      registryId: 'test',
      lifecycle: 'active',
      probes: [
        {
          kind: 'config',
          candidate: '$HOME/.agent',
          found: true,
          resolvedPath: '/Users/test/.agent',
        },
      ],
      capabilities: [
        {
          capability: 'mcp',
          status: 'failed',
          summary: 'Bearer private-token {"access_token":"oauth-value"}',
          findings: [
            '/Users/test/.agent key=secret-value sk-example123456789 {"client_secret":"oauth-secret"}',
          ],
        },
      ],
    },
  ]

  const serialized = JSON.stringify(redactHealthReport(report, '/Users/test'))
  assert.equal(serialized.includes('/Users/test'), false)
  assert.equal(serialized.includes('private-token'), false)
  assert.equal(serialized.includes('secret-value'), false)
  assert.equal(serialized.includes('sk-example'), false)
  assert.equal(serialized.includes('oauth-value'), false)
  assert.equal(serialized.includes('oauth-secret'), false)
})
