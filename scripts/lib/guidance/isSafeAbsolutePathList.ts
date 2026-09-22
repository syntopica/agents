export const isSafeAbsolutePathList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) =>
      typeof item === 'string' &&
      item.startsWith('/') &&
      !/[\r\n\0"]/u.test(item),
  )
