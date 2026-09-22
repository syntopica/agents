export const findUnknownReconciliationResultProperties = (
  raw: Record<string, unknown>,
): string[] => {
  const properties = new Set([
    'version',
    'inputHashes',
    'shared',
    'claudeOverlay',
    'codexOverlay',
    'claudeDocument',
    'codexDocument',
    'documentation',
    'decisions',
    'warnings',
    'unresolvedLimitations',
  ])
  return Object.keys(raw).flatMap((key) =>
    properties.has(key) ? [] : [`unknown property: ${key}`],
  )
}
