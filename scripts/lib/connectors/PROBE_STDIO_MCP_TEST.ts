import assert from 'node:assert/strict'
import test from 'node:test'
import { probeStdioMcp } from './probeStdioMcp'

void test('the stdio probe requires both initialize and tools/list responses', async () => {
  const server = [
    'const rl = require("node:readline").createInterface({ input: process.stdin })',
    'let initialized = false',
    'rl.on("line", (line) => {',
    '  const request = JSON.parse(line)',
    '  if (request.method === "initialize") {',
    '    if (request.params.protocolVersion !== "2025-11-25") process.exit(1)',
    '    const result = { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "strict-test-server", version: "1.0.0" } }',
    '    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\\n")',
    '  } else if (request.method === "notifications/initialized") {',
    '    initialized = true',
    '  } else if (request.method === "tools/list") {',
    '    if (!initialized) process.exit(1)',
    '    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { tools: [] } }) + "\\n")',
    '  } else {',
    '    process.exit(1)',
    '  }',
    '})',
  ].join('\n')

  const result = await probeStdioMcp(process.execPath, ['-e', server])
  assert.equal(result.status, 'healthy')
  assert.equal(result.summary, 'MCP initialize and tools/list succeeded')
})

void test('the stdio probe rejects unsupported initialization negotiation', async () => {
  const server = [
    'const rl = require("node:readline").createInterface({ input: process.stdin })',
    'rl.on("line", (line) => {',
    '  const request = JSON.parse(line)',
    '  const result = { protocolVersion: "unsupported", capabilities: { tools: {} }, serverInfo: { name: "test-server", version: "1.0.0" } }',
    '  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\\n")',
    '})',
  ].join('\n')

  const result = await probeStdioMcp(process.execPath, ['-e', server])
  assert.equal(result.status, 'failed')
  assert.equal(result.summary, 'MCP initialization negotiation is unsupported')
})

void test('the stdio probe accepts every supported negotiated MCP version', async () => {
  for (const protocolVersion of [
    '2025-11-25',
    '2025-06-18',
    '2025-03-26',
    '2024-11-05',
  ]) {
    const server = [
      'const rl = require("node:readline").createInterface({ input: process.stdin })',
      'rl.on("line", (line) => {',
      '  const request = JSON.parse(line)',
      '  if (request.method === "initialize") {',
      `    const result = { protocolVersion: ${JSON.stringify(protocolVersion)}, capabilities: { tools: {} }, serverInfo: { name: "compatible-server", version: "1.0.0" } }`,
      '    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\\n")',
      '  } else if (request.method === "tools/list") {',
      '    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { tools: [] } }) + "\\n")',
      '  }',
      '})',
    ].join('\n')

    const result = await probeStdioMcp(process.execPath, ['-e', server])
    assert.equal(result.status, 'healthy', protocolVersion)
  }
})

void test('the stdio probe rejects malformed JSON-RPC and serverInfo initialization responses', async () => {
  const malformedJsonRpcServer = [
    'const rl = require("node:readline").createInterface({ input: process.stdin })',
    'rl.on("line", (line) => {',
    '  const request = JSON.parse(line)',
    '  const result = { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "test-server", version: "1.0.0" } }',
    '  process.stdout.write(JSON.stringify({ jsonrpc: "1.0", id: request.id, result }) + "\\n")',
    '})',
  ].join('\n')
  const malformedServerInfoServer = [
    'const rl = require("node:readline").createInterface({ input: process.stdin })',
    'rl.on("line", (line) => {',
    '  const request = JSON.parse(line)',
    '  const result = { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "", version: 1 } }',
    '  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\\n")',
    '})',
  ].join('\n')

  for (const server of [malformedJsonRpcServer, malformedServerInfoServer]) {
    const result = await probeStdioMcp(process.execPath, ['-e', server])
    assert.equal(result.status, 'failed')
    assert.equal(
      result.summary,
      'MCP initialization negotiation is unsupported',
    )
  }
})
