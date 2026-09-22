export const isAllowedDocumentationUrl = (
  url: string,
  origins: string[],
): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && origins.includes(parsed.origin)
  } catch {
    return false
  }
}
