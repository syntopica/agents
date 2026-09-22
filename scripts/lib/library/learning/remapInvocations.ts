export const remapInvocations = (
  invocations: Record<string, number>,
  keyIndex: Record<string, string>,
) => {
  const remapped: Record<string, number> = {}

  for (const [skill, count] of Object.entries(invocations)) {
    const key = keyIndex[skill] ?? skill
    remapped[key] = (remapped[key] ?? 0) + count
  }

  return remapped
}
