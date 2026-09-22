export const buildMcpInitializeRequest = () => ({
  jsonrpc: '2.0' as const,
  id: 'connector-doctor',
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'rocket-agents-connector-doctor', version: '1.0.0' },
  },
})
