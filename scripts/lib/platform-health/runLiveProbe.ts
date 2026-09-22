import { spawn } from 'node:child_process'
import { classifyLiveProbe } from './classifyLiveProbe'
import type { LiveProbeDefinition } from './types/LiveProbeDefinition'
import type { LiveProbeResult } from './types/LiveProbeResult'

export const runLiveProbe = async (
  definition: LiveProbeDefinition,
  env: NodeJS.ProcessEnv = process.env,
): Promise<LiveProbeResult> =>
  new Promise((resolve) => {
    const child = spawn(definition.command, definition.args, {
      env,
      shell: false,
    })
    let output = ''
    let timedOut = false

    child.stdout.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-65_536)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-65_536)
    })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 250).unref()
    }, definition.timeoutMs)

    child.on('error', () => {
      clearTimeout(timer)
      resolve({
        platformId: definition.platformId,
        capability: definition.capability,
        status: 'failed',
        summary: 'probe process could not start',
        timedOut: false,
        exitCode: null,
      })
    })

    child.on('close', (exitCode) => {
      clearTimeout(timer)
      const status = classifyLiveProbe(output, exitCode, timedOut)
      resolve({
        platformId: definition.platformId,
        capability: definition.capability,
        status,
        summary: timedOut
          ? 'probe timed out'
          : `probe completed with ${status}`,
        timedOut,
        exitCode,
      })
    })
  })
