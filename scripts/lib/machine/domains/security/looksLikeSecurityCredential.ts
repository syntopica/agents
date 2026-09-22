export const looksLikeSecurityCredential = (value: string): boolean =>
  /\bBearer\s+\S+/i.test(value) ||
  /\b(?:sk|pk|ghp)-[A-Za-z0-9_-]{8,}/.test(value) ||
  /^[A-Za-z0-9+/=_-]{32,}$/.test(value) ||
  /^[a-z][a-z\d+.-]*:\/\/[^\s/:]+:[^\s/@]+@/i.test(value)
