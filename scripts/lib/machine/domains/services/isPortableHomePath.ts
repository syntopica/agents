export const isPortableHomePath = (value: unknown): boolean =>
  typeof value === 'string' &&
  value !== '' &&
  !value.startsWith('/') &&
  !value.startsWith('~') &&
  !value.includes('$HOME') &&
  !value.includes('%h')
