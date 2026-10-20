import type { OwnedRecord } from '../../../ownership/OwnedRecord'
import type { apply } from '../apply'

export interface ApplySelectedMcpInput {
  selected: boolean
  owned: OwnedRecord
  run: () => ReturnType<typeof apply>
}
