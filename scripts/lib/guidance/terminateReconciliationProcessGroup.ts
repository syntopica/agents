import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { signalReconciliationProcessGroup } from './signalReconciliationProcessGroup'

/** Only accepts the child created with detached:true by this reconciliation run. */
export const terminateReconciliationProcessGroup = async (
  child: ChildProcessWithoutNullStreams,
): Promise<void> => {
  const groupId = child.pid
  if (groupId === undefined) return
  if (!signalReconciliationProcessGroup(groupId, 'SIGTERM')) return
  await setTimeout(250)
  signalReconciliationProcessGroup(groupId, 'SIGKILL')
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!signalReconciliationProcessGroup(groupId, 0)) return
    await setTimeout(25)
  }
  throw new Error('agent process group remained after forced cleanup')
}
