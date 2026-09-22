export const formatCapabilityApplyResult = (result: {
  cleaned: string[]
  linked: number
  copied: number
}) => {
  const parts = [
    ...(result.cleaned.length > 0
      ? [`cleaned ${String(result.cleaned.length)}`]
      : []),
    ...(result.linked > 0 ? [`${String(result.linked)} symlinked`] : []),
    ...(result.copied > 0 ? [`${String(result.copied)} copied`] : []),
  ]
  return parts.length === 0 ? 'unchanged' : parts.join(', ')
}
