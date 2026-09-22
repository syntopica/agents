import { promises as fs } from 'node:fs'

export const readFileOrEmpty = async (path: string) => {
  try {
    return await fs.readFile(path, 'utf8')
  } catch {
    return ''
  }
}
