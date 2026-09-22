export const containsSensitiveGuidanceContent = (value: string): boolean => {
  const lower = value.toLowerCase()
  const searchable = value.replaceAll('\\"', '"')
  return (
    (value.includes('-----BEGIN ') && value.includes('PRIVATE KEY-----')) ||
    /\bsk-[A-Za-z0-9_-]{12,}/u.test(value) ||
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/u.test(
      value,
    ) ||
    /\bBearer\s+[\w.~-]{12,}/iu.test(value) ||
    /["'](?:access_token|id_token|refresh_token|api[_-]?key|token|secret|password|authorization)["']\s*:\s*["'][^"']{8,}["']/iu.test(
      searchable,
    ) ||
    ['api_key', 'api-key', 'token', 'secret', 'password', 'authorization'].some(
      (label) => lower.includes(`${label}=`) || lower.includes(`${label}:`),
    ) ||
    value
      .split('\n')
      .some(
        (line) =>
          line.trimStart().startsWith('{"type":"session_meta"') ||
          line.trimStart().startsWith('{"type":"event_msg"'),
      )
  )
}
