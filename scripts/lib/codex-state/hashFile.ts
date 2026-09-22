import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'

export const hashFile = async (path: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const input = createReadStream(path)
    input.on('data', (chunk) => hash.update(chunk))
    input.on('error', (error) => {
      reject(new Error(error.message, { cause: error }))
    })
    input.on('end', () => {
      resolve(hash.digest('hex'))
    })
  })
