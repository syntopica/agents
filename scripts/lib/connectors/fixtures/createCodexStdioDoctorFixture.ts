import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { McpManifest } from '../../machine/domains/mcp/types/McpManifest'
import type { ConnectorDefinition } from '../types/ConnectorDefinition'

export const createCodexStdioDoctorFixture = async (
  failure?: 'initialize' | 'tools-list',
) => {
  const definition: ConnectorDefinition = {
    id: 'strict-mcp',
    match: 'strict-mcp',
    profiles: ['codex'],
    ownership: 'machine',
    probe: 'native-cli',
    criticality: 'required',
  }
  const initializeResponse =
    failure === 'initialize'
      ? 'process.exit(45)'
      : [
          'const result = { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "strict-server", version: "1.0.0" } }',
          'console.log(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }))',
        ].join('; ')
  const toolsListResponse =
    failure === 'tools-list'
      ? 'process.exit(44)'
      : 'console.log(JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { tools: [] } }))'
  const server = [
    'const rl = require("node:readline").createInterface({ input: process.stdin })',
    'if (!process.argv.includes("codex-override")) process.exit(41)',
    'let initialized = false',
    'rl.on("line", (line) => {',
    '  const request = JSON.parse(line)',
    '  if (request.method === "initialize") {',
    `    ${initializeResponse}`,
    '  } else if (request.method === "notifications/initialized") {',
    '    initialized = true',
    '  } else if (request.method === "tools/list") {',
    '    if (!initialized) process.exit(42)',
    `    ${toolsListResponse}`,
    '  } else {',
    '    process.exit(43)',
    '  }',
    '})',
  ].join('\n')
  const directory = await mkdtemp(join(tmpdir(), 'connector-doctor-mcp-'))
  const path = join(directory, 'server.cjs')
  await writeFile(path, server, { mode: 0o600 })
  const manifest: McpManifest = {
    servers: {
      'strict-mcp': {
        targets: ['codex'],
        transport: 'stdio',
        command: process.execPath,
        args: [path, 'base-argument'],
        startup_timeout_sec: 1,
        target_overrides: { codex: { args_append: ['codex-override'] } },
      },
    },
  }
  return { definition, directory, manifest }
}
