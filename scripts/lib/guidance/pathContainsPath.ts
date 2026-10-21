import { isAbsolute, relative, sep } from 'node:path'

export const pathContainsPath = (
  container: string,
  candidate: string,
): boolean => {
  const remainder = relative(container, candidate)
  return (
    remainder === '' ||
    (remainder !== '..' &&
      !remainder.startsWith(`..${sep}`) &&
      !isAbsolute(remainder))
  )
}
