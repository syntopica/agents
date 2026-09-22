import { spawn } from 'node:child_process'
import { stripNpmChatter } from './stripNpmChatter'
import type { StageResult } from './types/StageResult'

export const runBinStage = async (
  name: string,
  binPath: string,
  args: string[],
): Promise<StageResult> =>
  new Promise((resolve) => {
    const child = spawn('npx', ['tsx', binPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    child.on('error', (error) => {
      resolve({ name, ok: false, output: String(error) })
    })

    child.on('close', (code) => {
      resolve({ name, ok: code === 0, output: stripNpmChatter(output) })
    })
  })
