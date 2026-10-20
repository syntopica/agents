import type { MachineStatus } from '../../types/MachineStatus'
import type { ToPluginsApplyStatusInput } from './types/ToPluginsApplyStatusInput'

export const toPluginsApplyStatus = ({
  result,
  pruned,
}: ToPluginsApplyStatusInput): MachineStatus => {
  if (result.failed.length > 0) {
    return 'failed'
  }

  return result.applied.length + pruned === 0 ? 'converged' : 'changed'
}
