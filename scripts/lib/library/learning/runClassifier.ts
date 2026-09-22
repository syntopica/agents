import { spawn } from 'node:child_process'

export const runClassifier = async (
  command: string,
  batchPath: string,
  anchorsPath?: string,
) =>
  new Promise<string>((resolve) => {
    const child = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'inherit'],
      env: {
        ...process.env,
        LIBRARY_BATCH: batchPath,
        ...(anchorsPath === undefined ? {} : { LIBRARY_ANCHORS: anchorsPath }),
      },
    })
    let output = ''

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    child.on('error', () => {
      resolve('')
    })

    child.on('close', () => {
      resolve(output)
    })
  })
