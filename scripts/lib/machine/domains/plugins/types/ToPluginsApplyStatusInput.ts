import type { PluginsApplyResult } from './PluginsApplyResult'

export interface ToPluginsApplyStatusInput {
  result: PluginsApplyResult
  pruned: number
}
