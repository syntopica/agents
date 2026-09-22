import assert from 'node:assert/strict'
import test from 'node:test'
import { matchesConnectorLine } from './matchesConnectorLine'
import type { ConnectorDefinition } from './types/ConnectorDefinition'

void test('a directly configured server matches on its bare name', () => {
  const definition = {
    id: 'gateway-example',
    match: 'gateway-example',
    profiles: ['claude-personal'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  } as ConnectorDefinition

  assert.equal(
    matchesConnectorLine(
      'gateway-example: https://gateway.example.com/mcp (HTTP) - Connected',
      definition,
    ),
    true,
  )
})

void test('a plugin-provided server satisfies the same connector', () => {
  const definition = {
    id: 'context7',
    match: 'context7',
    profiles: ['claude-personal'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  } as ConnectorDefinition

  assert.equal(
    matchesConnectorLine(
      'plugin:context7:context7: https://mcp.context7.com/mcp (HTTP) - Connected',
      definition,
    ),
    true,
  )
})

void test("another plugin's server does not satisfy this connector", () => {
  const definition = {
    id: 'context7',
    match: 'context7',
    profiles: ['claude-personal'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  } as ConnectorDefinition

  assert.equal(
    matchesConnectorLine(
      'plugin:cloudflare:cloudflare-api: https://mcp.cloudflare.com/mcp (HTTP) - Connected',
      definition,
    ),
    false,
  )
})

void test('a hosted connector whose name merely contains the match does not count', () => {
  const definition = {
    id: 'slack',
    match: 'slack',
    profiles: ['claude-personal'],
    ownership: 'account',
    probe: 'native-cli',
    criticality: 'optional',
  } as ConnectorDefinition

  assert.equal(
    matchesConnectorLine(
      'claude.ai Slack: https://mcp.slack.com/mcp - Connected',
      definition,
    ),
    false,
  )
})
