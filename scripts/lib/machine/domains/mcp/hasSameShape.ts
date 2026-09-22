import { isDeepStrictEqual } from 'node:util'

export const hasSameShape = (left: unknown, right: unknown) =>
  isDeepStrictEqual(left, right)
