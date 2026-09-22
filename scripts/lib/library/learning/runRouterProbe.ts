import { spawn } from 'node:child_process'

export const runRouterProbe = async (routerPath: string, prompt: string) =>
  new Promise<string | undefined>((resolve) => {
    const child = spawn('python3', [routerPath], {
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    let output = ''

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    child.on('error', () => {
      resolve(undefined)
    })

    child.on('close', () => {
      if (output.trim() === '') {
        resolve(undefined)
        return
      }

      try {
        const parsed = JSON.parse(output) as {
          hookSpecificOutput?: { additionalContext?: string }
        }
        resolve(parsed.hookSpecificOutput?.additionalContext)
      } catch {
        resolve(undefined)
      }
    })

    child.stdin.write(JSON.stringify({ prompt, session_id: '' }))
    child.stdin.end()
  })
