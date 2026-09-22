export const collectTransportErrors = (
  name: string,
  server: Record<string, unknown>,
  errors: string[],
) => {
  const transport = server['transport']

  if (transport === 'stdio') {
    if (typeof server['command'] !== 'string') {
      errors.push(`${name}: stdio transport needs a command`)
    }
    if (server['url'] !== undefined) {
      errors.push(`${name}: stdio transport must not carry a url`)
    }
    return
  }

  if (transport === 'http' || transport === 'sse') {
    if (typeof server['url'] !== 'string') {
      errors.push(`${name}: ${transport} transport needs a url`)
    }
    if (server['command'] !== undefined) {
      errors.push(`${name}: ${transport} transport must not carry a command`)
    }
    return
  }

  errors.push(`${name}: transport must be stdio, http or sse`)
}
