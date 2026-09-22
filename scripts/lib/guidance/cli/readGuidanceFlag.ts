export const readGuidanceFlag = (
  argv: string[],
  name: string,
): string | undefined => {
  const values: string[] = []
  for (const [index, argument] of argv.entries()) {
    if (argument !== name) continue
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--'))
      throw new Error(`missing value for ${name}`)
    values.push(value)
  }
  if (new Set(values).size > 1)
    throw new Error(`conflicting values for ${name}`)
  return values[0]
}
