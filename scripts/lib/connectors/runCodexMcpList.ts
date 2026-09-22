import { spawn } from 'node:child_process'

export const runCodexMcpList = (
  executable = 'codex',
  spawnCodex: typeof spawn = spawn,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawnCodex(executable, ['mcp', 'list', '--json'], {
      shell: false,
    })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-65_536)
    })
    child.stderr.resume()
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output)
        return
      }
      reject(new Error('Codex MCP list failed'))
    })
  })
