import type { MachineStatus } from '../../types/MachineStatus'
import type { ServicesApplyResult } from './types/ServicesApplyResult'

export const toServicesApplyStatus = (
  result: ServicesApplyResult,
): MachineStatus => {
  if (result.failed.length > 0) {
    return 'failed'
  }

  return result.written.length === 0 ? 'converged' : 'changed'
}
