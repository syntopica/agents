export const redactHealthText = (value: string, home: string): string =>
  value
    .replaceAll(home, '$HOME')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sk|pk|ghp)-[A-Za-z0-9_-]{8,}/g, '[REDACTED]')
    .replace(
      /(["']?(?:access_token|refresh_token|id_token|client_secret|api[_-]?key)["']?\s*:\s*["'])[^"']+(["'])/gi,
      '$1[REDACTED]$2',
    )
    .replace(/\b(key|token|secret|password)=\S+/gi, '$1=[REDACTED]')
