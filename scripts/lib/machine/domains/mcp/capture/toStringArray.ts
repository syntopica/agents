export const toStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined
