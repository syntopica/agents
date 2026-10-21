import type { ChildProcessWithoutNullStreams } from 'node:child_process'

export const terminateHookInspection = (
  child: ChildProcessWithoutNullStreams,
): void => {
  child.stdin.destroy()
  child.stdout.destroy()
  child.stderr.destroy()
  if (child.exitCode !== null || child.signalCode !== null) return
  const escalation = setTimeout(() => {
    child.kill('SIGKILL')
  }, 250)
  escalation.unref()
  child.once('close', () => {
    clearTimeout(escalation)
  })
  child.kill('SIGTERM')
}
