import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { isRecord } from '../guidance/isRecord'
import { isCodexHooksSnapshot } from './isCodexHooksSnapshot'
import { terminateHookInspection } from './terminateHookInspection'
import type { CodexHooksSnapshot } from './types/CodexHooksSnapshot'

export const readCodexHooksSnapshot = async (
  cwd: string,
  executable = 'codex',
  timeoutMs = 15_000,
): Promise<CodexHooksSnapshot> => {
  const child = spawn(executable, ['app-server', '--stdio'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  child.stderr.resume()
  const lines = createInterface({ input: child.stdout })
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await new Promise((resolve, reject) => {
      let initialized = false
      let bytes = 0
      timer = setTimeout(() => {
        reject(new Error('Codex hook inspection timed out.'))
      }, timeoutMs)
      child.stdout.on('data', (chunk: Buffer) => {
        bytes += chunk.length
        if (bytes > 4 * 1024 * 1024) {
          lines.close()
          child.stdout.pause()
          reject(new Error('Codex hook inspection exceeded its output limit.'))
        }
      })
      child.once('error', () => {
        reject(new Error('Codex hook inspection could not start.'))
      })
      child.once('close', () => {
        reject(new Error('Codex hook inspection ended without a response.'))
      })
      child.stdin.on('error', () => {
        reject(new Error('Codex hook inspection input closed.'))
      })
      lines.on('line', (line) => {
        try {
          if (line.length > 1024 * 1024) throw new Error('Oversized frame')
          const message: unknown = JSON.parse(line)
          if (!isRecord(message)) throw new Error('Invalid RPC response')
          if (message['id'] !== 1 && message['id'] !== 2) return
          if (message['error']) throw new Error('RPC error')
          if (message['id'] === 1) {
            if (initialized || !isRecord(message['result']))
              throw new Error('Invalid initialization')
            initialized = true
            child.stdin.write(`${JSON.stringify({ method: 'initialized' })}\n`)
            child.stdin.write(
              `${JSON.stringify({ id: 2, method: 'hooks/list', params: { cwds: [cwd] } })}\n`,
            )
          } else {
            if (!initialized || !isCodexHooksSnapshot(message['result']))
              throw new Error('Invalid hook snapshot')
            resolve(message['result'])
          }
        } catch {
          reject(
            new Error('Codex hook inspection returned an invalid response.'),
          )
        }
      })
      child.stdin.write(
        `${JSON.stringify({
          id: 1,
          method: 'initialize',
          params: {
            clientInfo: {
              name: 'rocket-agents-hooks-doctor',
              version: '1.0.0',
            },
            capabilities: { experimentalApi: true },
          },
        })}\n`,
      )
    })
  } finally {
    clearTimeout(timer)
    lines.close()
    terminateHookInspection(child)
  }
}
