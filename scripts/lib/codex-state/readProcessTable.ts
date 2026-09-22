import { spawn } from 'node:child_process'

export const readProcessTable = async (): Promise<string> =>
  new Promise((resolve) => {
    const child = spawn('ps', ['-axo', 'pid=,command='], {
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-1_048_576)
    })
    child.on('error', () => {
      resolve('')
    })
    child.on('close', () => {
      resolve(output)
    })
  })
