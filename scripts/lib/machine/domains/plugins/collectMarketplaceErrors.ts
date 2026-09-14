export const collectMarketplaceErrors = (raw: unknown, errors: string[]) => {
  if (!Array.isArray(raw)) {
    errors.push('manifest.marketplaces must be an array')
    return
  }

  raw.forEach((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      errors.push(`manifest.marketplaces[${String(index)}] must be an object`)
      return
    }

    const record = entry as Record<string, unknown>

    if (typeof record['name'] !== 'string' || record['name'] === '') {
      errors.push(
        `manifest.marketplaces[${String(index)}].name must be a non-empty string`,
      )
    }
    if (typeof record['source'] !== 'string' || record['source'] === '') {
      errors.push(
        `manifest.marketplaces[${String(index)}].source must be a non-empty string`,
      )
    }
  })
}
