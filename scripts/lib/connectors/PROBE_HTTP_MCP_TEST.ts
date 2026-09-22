import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { probeHttpMcp } from './probeHttpMcp'

void test('the HTTP probe sends initialize and returns no response body', async () => {
  const server = createServer((request, response) => {
    assert.equal(request.method, 'POST')
    response.setHeader('content-type', 'application/json')
    response.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 'connector-doctor',
        result: { protocolVersion: '2025-06-18' },
      }),
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const result = await probeHttpMcp(
    `http://127.0.0.1:${String(address.port)}/mcp`,
  )
  server.close()
  assert.equal(result.status, 'healthy')
  assert.equal('body' in result, false)
})

void test('the HTTP probe reports a bounded timeout', async () => {
  const server = createServer(() => undefined)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const result = await probeHttpMcp(
    `http://127.0.0.1:${String(address.port)}/mcp`,
    20,
  )
  server.closeAllConnections()
  server.close()
  assert.equal(result.status, 'failed')
  assert.equal(result.boundary, 'network')
  assert.equal(result.summary, 'connector request timed out')
})
