import { createHash } from 'node:crypto'

export const sha256Text = (value: string): string =>
  createHash('sha256').update(value).digest('hex')
