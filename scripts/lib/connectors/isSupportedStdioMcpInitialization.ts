export const isSupportedStdioMcpInitialization = (
  response: unknown,
): boolean => {
  if (
    typeof response !== 'object' ||
    response === null ||
    Array.isArray(response)
  )
    return false
  const envelope = response as Record<string, unknown>
  if (
    envelope['jsonrpc'] !== '2.0' ||
    envelope['id'] !== 'connector-doctor-initialize' ||
    typeof envelope['result'] !== 'object' ||
    envelope['result'] === null ||
    Array.isArray(envelope['result'])
  ) {
    return false
  }
  const candidate = envelope['result'] as Record<string, unknown>
  if (
    candidate['protocolVersion'] !== '2025-11-25' &&
    candidate['protocolVersion'] !== '2025-06-18' &&
    candidate['protocolVersion'] !== '2025-03-26' &&
    candidate['protocolVersion'] !== '2024-11-05'
  ) {
    return false
  }
  const capabilities = candidate['capabilities']
  if (
    typeof capabilities !== 'object' ||
    capabilities === null ||
    Array.isArray(capabilities)
  ) {
    return false
  }
  const tools = (capabilities as Record<string, unknown>)['tools']
  const serverInfo = candidate['serverInfo']
  if (
    typeof serverInfo !== 'object' ||
    serverInfo === null ||
    Array.isArray(serverInfo)
  ) {
    return false
  }
  const server = serverInfo as Record<string, unknown>
  return (
    typeof tools === 'object' &&
    tools !== null &&
    !Array.isArray(tools) &&
    typeof server['name'] === 'string' &&
    server['name'].trim().length > 0 &&
    typeof server['version'] === 'string' &&
    server['version'].trim().length > 0
  )
}
