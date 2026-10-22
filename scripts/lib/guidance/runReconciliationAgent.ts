import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSandboxCommand } from './createSandboxCommand'
import { finalizeReconciliationProcess } from './finalizeReconciliationProcess'
import { readSafeAgentDiagnostic } from './readSafeAgentDiagnostic'
import { stageAgentBootstrapFiles } from './stageAgentBootstrapFiles'
import { terminateReconciliationProcessGroup } from './terminateReconciliationProcessGroup'
import type { GuidancePolicy } from './types/GuidancePolicy'

export const runReconciliationAgent = async (
  policy: GuidancePolicy,
  prompt: string,
  readDenyRoot?: string,
): Promise<unknown> =>
  await (async () => {
    const scratchDir = await realpath(
      await mkdtemp(join(tmpdir(), 'guidance-agent-')),
    )
    let child: ChildProcessWithoutNullStreams | undefined
    let termination: Promise<void> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const bootstrapDir = await stageAgentBootstrapFiles(
        policy.agentBootstrapFiles ?? [],
        scratchDir,
      )
      return await new Promise((resolve, reject) => {
        const [command, ...args] = policy.agentCommand
        if (command === undefined) {
          reject(new Error('agent command is empty'))
          return
        }
        if (!command.startsWith('/')) {
          reject(new Error('agent command must be an absolute executable path'))
          return
        }
        const sandbox = createSandboxCommand({
          platform: process.platform,
          scratchDir,
          ...(readDenyRoot === undefined ? {} : { readDenyRoot }),
          ...(policy.agentReadAllowlist === undefined
            ? {}
            : { readAllowPaths: policy.agentReadAllowlist }),
          command,
          args,
        })
        child = spawn(sandbox.executable, sandbox.args, {
          cwd: '/',
          env: {
            PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
            HOME: '/nonexistent',
            LANG: 'C',
            LC_ALL: 'C',
            NO_COLOR: '1',
            TMPDIR: scratchDir,
            ...(bootstrapDir === undefined
              ? {}
              : { ROCKET_AGENTS_BOOTSTRAP_DIR: bootstrapDir }),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false,
          detached: true,
        })
        const chunks: Buffer[] = []
        const errorChunks: Buffer[] = []
        let bytes = 0
        let errorBytes = 0
        timer = setTimeout(() => {
          reject(new Error('agent exceeded configured timeout'))
        }, policy.timeoutMs)
        child.stdout.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > policy.maxOutputBytes)
            reject(new Error('agent output exceeded configured byte limit'))
          else chunks.push(chunk)
        })
        child.stderr.on('data', (chunk: Buffer) => {
          errorBytes += chunk.length
          if (errorBytes > policy.maxOutputBytes)
            reject(new Error('agent stderr exceeded configured byte limit'))
          else errorChunks.push(chunk)
        })
        child.on('error', reject)
        child.stdin.on('error', () => {
          reject(new Error('agent input closed unexpectedly'))
        })
        child.once('exit', () => {
          if (child !== undefined)
            termination ??= terminateReconciliationProcessGroup(child)
          termination?.catch(reject)
        })
        child.on('close', (code) => {
          clearTimeout(timer)
          if (bytes > policy.maxOutputBytes) {
            reject(new Error('agent output exceeded configured byte limit'))
            return
          }
          if (errorBytes > policy.maxOutputBytes) {
            reject(new Error('agent stderr exceeded configured byte limit'))
            return
          }
          if (code !== 0) {
            const diagnostic = readSafeAgentDiagnostic(
              Buffer.concat(errorChunks),
            )
            const diagnosticSuffix =
              diagnostic === undefined ? '' : `; ${diagnostic}`
            reject(
              new Error(
                `agent exited with code ${String(code)}; stderr bytes: ${String(errorBytes)}${diagnosticSuffix}`,
              ),
            )
            return
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
          } catch {
            reject(new Error('agent returned invalid JSON'))
          }
        })
        child.stdin.end(prompt)
      })
    } finally {
      clearTimeout(timer)
      if (child !== undefined) {
        termination ??= terminateReconciliationProcessGroup(child)
        await finalizeReconciliationProcess(child, termination)
      }
      // Preserve private scratch if termination cannot confirm the group stopped.
      await rm(scratchDir, { recursive: true, force: true })
    }
  })()
