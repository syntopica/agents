import type { ChildProcessWithoutNullStreams } from 'node:child_process'

export const finalizeReconciliationProcess = async (
  child: Pick<ChildProcessWithoutNullStreams, 'stdin' | 'stdout' | 'stderr'>,
  termination: Promise<void>,
): Promise<void> => {
  try {
    await termination
  } catch {
    throw new Error('agent process group cleanup could not be confirmed')
  } finally {
    child.stdin.destroy()
    child.stdout.destroy()
    child.stderr.destroy()
  }
}
