import { isAbsolute, relative } from 'node:path'

export const pathContainsPath = (
  container: string,
  candidate: string,
): boolean => {
  const remainder = relative(container, candidate)
  return (
    remainder === '' || (!remainder.startsWith('..') && !isAbsolute(remainder))
  )
}
