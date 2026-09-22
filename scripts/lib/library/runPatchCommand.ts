import { spawn } from 'node:child_process'

export const runPatchCommand = async (args: string[], cwd: string) =>
  new Promise<{ code: number; stderr: string }>((resolve) => {
    const child = spawn('git', args, {
      cwd,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      resolve({ code: 1, stderr: String(error) })
    })

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stderr })
    })
  })
