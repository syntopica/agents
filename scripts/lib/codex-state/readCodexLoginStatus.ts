import { spawn } from 'node:child_process'
import type { CodexLoginStatus } from './types/CodexLoginStatus'

export const readCodexLoginStatus = async (
  command = 'codex',
  env: NodeJS.ProcessEnv = process.env,
): Promise<CodexLoginStatus> =>
  new Promise((resolve) => {
    const child = spawn(command, ['login', 'status'], {
      env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const append = (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-8192)
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    child.on('error', () => {
      resolve('signed-out')
    })
    child.on('close', () => {
      if (/logged in using ChatGPT/i.test(output)) resolve('chatgpt')
      else if (/logged in using an API key/i.test(output)) resolve('api')
      else resolve('signed-out')
    })
  })
